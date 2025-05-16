import { Request, Response } from 'express';
import { getPushedAuthRequest, deletePushedAuthRequest } from '../data/pg-par';
import { getPaymentConsentById, updatePaymentConsentStatus } from '../data/pg-consents';
import { ConsentStatus } from '../models/consent';
import { publishPaymentConsentEvent, mapConsentStatusToEventType } from '../services/event-publisher';

/**
 * Handle authorization request
 * @param req Express request
 * @param res Express response
 */
export const handleAuthorizationRequest = async (req: Request, res: Response) => {
  try {
    console.log('Authorization request received:', {
      method: req.method,
      query: req.query,
      headers: req.headers
    });
    
    const { request_uri, tpp_consent_id } = req.query;
    
    if (!request_uri) {
      console.error('Missing request_uri parameter');
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'request_uri is required'
      });
    }
    
    console.log(`Looking up request_uri: ${request_uri}`);
    
    // Get the pushed authorization request
    const authRequest = await getPushedAuthRequest(request_uri as string);
    
    if (!authRequest) {
      console.error(`Request URI not found or expired: ${request_uri}`);
      return res.status(400).json({
        error: 'invalid_request_uri',
        error_description: 'The request URI was not found or has expired'
      });
    }
    
    console.log('Found authorization request:', authRequest);
    
    // If this is a HEAD request, just return 200 OK without processing further
    // This is to handle the preflight check from the TPP
    if (req.method === 'HEAD') {
      console.log('HEAD request detected, returning 200 OK without processing');
      return res.status(200).end();
    }
    
    // For demo purposes, we'll automatically authorize the request
    // In a real implementation, this would show a consent screen to the user
    
    // Determine which consent ID to use
    // Priority: 1. tpp_consent_id from query params, 2. consentId from PAR request
    const consentId = (tpp_consent_id as string) || authRequest.consentId;
    
    console.log(`Using consent ID: ${consentId}`);
    
    if (consentId) {
      // Get the consent
      const consent = await getPaymentConsentById(consentId);
      
      if (!consent) {
        console.error(`Consent not found: ${consentId}`);
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'The specified consent was not found'
        });
      }
      
      console.log(`Authorizing consent: ${consentId}`);
      
      // Update the consent status to Authorised
      const updatedConsent = await updatePaymentConsentStatus(consentId, ConsentStatus.AUTHORISED);
      
      // Publish event for consent authorization
      if (updatedConsent) {
        const eventType = mapConsentStatusToEventType(ConsentStatus.AUTHORISED);
        if (eventType) {
          publishPaymentConsentEvent(eventType, consentId, {
            consentId,
            status: ConsentStatus.AUTHORISED,
            timestamp: updatedConsent.StatusUpdateDateTime
          }).catch(error => {
            console.error('Failed to publish consent authorized event:', error);
          });
        }
      }
    } else {
      console.log('No consent ID provided, skipping consent authorization');
    }
    
    // Generate an authorization code
    const code = `code-${Math.random().toString(36).substring(2, 15)}`;
    console.log(`Generated authorization code: ${code}`);
    
    // Delete the pushed authorization request as it's been used
    await deletePushedAuthRequest(authRequest.requestUri);
    console.log(`Deleted pushed authorization request: ${authRequest.requestUri}`);
    
    // Redirect back to the client with the authorization code
    const redirectUrl = new URL(authRequest.redirectUri);
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('state', authRequest.state);
    
    console.log(`Redirecting to: ${redirectUrl.toString()}`);
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error handling authorization request:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An internal server error occurred'
    });
  }
};

/**
 * Authorize a payment consent
 * @param req Express request
 * @param res Express response
 */
export const authorizePaymentConsent = async (req: Request, res: Response) => {
  try {
    console.log('Payment consent authorization request received:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });
    
    const { consentId } = req.params;
    console.log(`Authorizing payment consent: ${consentId}`);
    
    // Get the consent
    const consent = await getPaymentConsentById(consentId);
    
    if (!consent) {
      console.error(`Consent not found: ${consentId}`);
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment consent with ID ${consentId} not found`
      });
    }
    
    console.log(`Found consent: ${consentId}, current status: ${consent.Status}`);
    
    // Update the consent status to Authorised
    const updatedConsent = await updatePaymentConsentStatus(consentId, ConsentStatus.AUTHORISED);
    
    // Publish event for consent authorization
    if (updatedConsent) {
      const eventType = mapConsentStatusToEventType(ConsentStatus.AUTHORISED);
      if (eventType) {
        publishPaymentConsentEvent(eventType, consentId, {
          consentId,
          status: ConsentStatus.AUTHORISED,
          timestamp: updatedConsent.StatusUpdateDateTime
        }).catch(error => {
          console.error('Failed to publish consent authorized event:', error);
        });
      }
    }
    
    if (!updatedConsent) {
      console.error(`Failed to update consent status: ${consentId}`);
      return res.status(500).json({
        ErrorCode: 'InternalServerError',
        ErrorMessage: 'Failed to update consent status'
      });
    }
    
    console.log(`Successfully updated consent status to ${updatedConsent.Status}`);
    
    // Return the updated consent
    const response = {
      Data: {
        ConsentId: updatedConsent.ConsentId,
        CreationDateTime: updatedConsent.CreationDateTime,
        Status: updatedConsent.Status,
        StatusUpdateDateTime: updatedConsent.StatusUpdateDateTime,
        Initiation: updatedConsent.Initiation,
        ExpirationDateTime: updatedConsent.ExpirationDateTime
      },
      Risk: updatedConsent.Risk,
      Links: {
        Self: `${req.protocol}://${req.get('host')}/domestic-payment-consents/${consentId}`
      },
      Meta: {
        TotalPages: 1
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error authorizing payment consent:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};