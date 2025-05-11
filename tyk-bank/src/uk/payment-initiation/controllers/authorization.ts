import { Request, Response } from 'express';
import { getPushedAuthRequest, deletePushedAuthRequest } from '../data/par';
import { getPaymentConsentById, updatePaymentConsentStatus } from '../data/consents';
import { ConsentStatus } from '../models/consent';

/**
 * Handle authorization request
 * @param req Express request
 * @param res Express response
 */
export const handleAuthorizationRequest = (req: Request, res: Response) => {
  try {
    const { request_uri } = req.query;
    
    if (!request_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'request_uri is required'
      });
    }
    
    // Get the pushed authorization request
    const authRequest = getPushedAuthRequest(request_uri as string);
    
    if (!authRequest) {
      return res.status(400).json({
        error: 'invalid_request_uri',
        error_description: 'The request URI was not found or has expired'
      });
    }
    
    // For demo purposes, we'll automatically authorize the request
    // In a real implementation, this would show a consent screen to the user
    
    // Check if there's a consent ID in the request
    if (authRequest.consentId) {
      // Get the consent
      const consent = getPaymentConsentById(authRequest.consentId);
      
      if (!consent) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'The specified consent was not found'
        });
      }
      
      // Update the consent status to Authorised
      updatePaymentConsentStatus(authRequest.consentId, ConsentStatus.AUTHORISED);
    }
    
    // Generate an authorization code
    const code = `code-${Math.random().toString(36).substring(2, 15)}`;
    
    // Delete the pushed authorization request as it's been used
    deletePushedAuthRequest(authRequest.requestUri);
    
    // Redirect back to the client with the authorization code
    const redirectUrl = new URL(authRequest.redirectUri);
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('state', authRequest.state);
    
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
export const authorizePaymentConsent = (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    
    // Get the consent
    const consent = getPaymentConsentById(consentId);
    
    if (!consent) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment consent with ID ${consentId} not found`
      });
    }
    
    // Update the consent status to Authorised
    const updatedConsent = updatePaymentConsentStatus(consentId, ConsentStatus.AUTHORISED);
    
    if (!updatedConsent) {
      return res.status(500).json({
        ErrorCode: 'InternalServerError',
        ErrorMessage: 'Failed to update consent status'
      });
    }
    
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