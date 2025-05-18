import { Request, Response } from 'express';
import {
  createPaymentConsent,
  getPaymentConsentById,
  checkFundsAvailability,
  updatePaymentConsentStatus
} from '../data/pg-consents';
import {
  DomesticPaymentConsentRequest,
  ConsentStatus
} from '../models/consent';
import { Links, Meta } from '../../../common/types/common';
import {
  publishPaymentConsentEvent,
  publishFundsConfirmationEvent,
  mapConsentStatusToEventType,
  EventType
} from '../services/event-publisher';

/**
 * Create a new domestic payment consent
 * @param req Express request
 * @param res Express response
 */
export const createDomesticPaymentConsent = async (req: Request, res: Response) => {
  try {
    const consentRequest = req.body as DomesticPaymentConsentRequest;
    
    // Validate request body
    if (!consentRequest?.Data?.Initiation) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'Initiation object is required'
      });
    }
    
    const { Initiation } = consentRequest.Data;
    
    // Validate required fields
    if (!Initiation.InstructionIdentification) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'InstructionIdentification is required'
      });
    }
    
    if (!Initiation.EndToEndIdentification) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'EndToEndIdentification is required'
      });
    }
    
    if (!Initiation.InstructedAmount?.Amount || !Initiation.InstructedAmount?.Currency) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'InstructedAmount with Amount and Currency is required'
      });
    }
    
    if (!Initiation.CreditorAccount?.Identification || !Initiation.CreditorAccount?.Name) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'CreditorAccount with Identification and Name is required'
      });
    }
    
    // Create new consent
    const newConsent = await createPaymentConsent(consentRequest.Data.Initiation, consentRequest.Risk || {});
    
    if (!newConsent) {
      return res.status(400).json({
        ErrorCode: 'ConsentCreationFailed',
        ErrorMessage: 'Failed to create payment consent'
      });
    }
    
    // Publish event for consent creation
    const eventType = mapConsentStatusToEventType(ConsentStatus.AWAITING_AUTHORISATION);
    if (eventType) {
      publishPaymentConsentEvent(eventType, newConsent.ConsentId, {
        consentId: newConsent.ConsentId,
        status: ConsentStatus.AWAITING_AUTHORISATION,
        timestamp: newConsent.CreationDateTime
      }).catch(error => {
        console.error('Failed to publish consent created event:', error);
      });
    }
    
    // Build response
    const response = {
      Data: {
        ConsentId: newConsent.ConsentId,
        CreationDateTime: newConsent.CreationDateTime,
        Status: newConsent.Status,
        StatusUpdateDateTime: newConsent.StatusUpdateDateTime,
        Initiation: newConsent.Initiation,
        ExpirationDateTime: newConsent.ExpirationDateTime
      },
      Risk: newConsent.Risk,
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}/${newConsent.ConsentId}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating domestic payment consent:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get domestic payment consent by ID
 * @param req Express request
 * @param res Express response
 */
export const getDomesticPaymentConsent = async (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    
    const consent = await getPaymentConsentById(consentId);
    
    if (!consent) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment consent with ID ${consentId} not found`
      });
    }
    
    const response = {
      Data: {
        ConsentId: consent.ConsentId,
        CreationDateTime: consent.CreationDateTime,
        Status: consent.Status,
        StatusUpdateDateTime: consent.StatusUpdateDateTime,
        Initiation: consent.Initiation,
        ExpirationDateTime: consent.ExpirationDateTime
      },
      Risk: consent.Risk,
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      },
      Meta: {
        TotalPages: 1
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting domestic payment consent:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get funds confirmation for a domestic payment consent
 * @param req Express request
 * @param res Express response
 */
export const getDomesticPaymentConsentFundsConfirmation = async (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    
    const consent = await getPaymentConsentById(consentId);
    
    if (!consent) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment consent with ID ${consentId} not found`
      });
    }
    
    // Check if consent is authorized
    if (consent.Status !== ConsentStatus.AUTHORISED) {
      return res.status(400).json({
        ErrorCode: 'InvalidConsentStatus',
        ErrorMessage: `Consent with ID ${consentId} has status ${consent.Status}, expected ${ConsentStatus.AUTHORISED}`
      });
    }
    
    // Check funds availability
    const fundsAvailable = await checkFundsAvailability(consentId);
    
    // Publish funds confirmation event
    publishFundsConfirmationEvent(consentId, {
      consentId,
      fundsAvailable,
      timestamp: new Date()
    }).catch(error => {
      console.error('Failed to publish funds confirmation event:', error);
    });
    
    const response = {
      Data: {
        FundsAvailableResult: {
          FundsAvailable: fundsAvailable
        }
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      },
      Meta: {
        TotalPages: 1
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking funds availability:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Update consent status
 * @param req Express request
 * @param res Express response
 */
export const updateConsentStatus = async (req: Request, res: Response) => {
  try {
    console.log('Update consent status request received:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });
    
    const { consentId } = req.params;
    const { status } = req.body;
    
    // Validate the status
    if (!status || !Object.values(ConsentStatus).includes(status)) {
      return res.status(400).json({
        ErrorCode: 'InvalidStatus',
        ErrorMessage: 'Invalid consent status'
      });
    }
    
    // Get the consent
    const consent = await getPaymentConsentById(consentId);
    
    if (!consent) {
      console.error(`Consent not found: ${consentId}`);
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment consent with ID ${consentId} not found`
      });
    }
    
    console.log(`Found consent: ${consentId}, current status: ${consent.Status}, updating to: ${status}`);
    
    // Update the consent status
    const updatedConsent = await updatePaymentConsentStatus(consentId, status);
    
    // Publish event for consent status update
    if (updatedConsent) {
      const eventType = mapConsentStatusToEventType(status);
      if (eventType) {
        publishPaymentConsentEvent(eventType, consentId, {
          consentId,
          status,
          timestamp: updatedConsent.StatusUpdateDateTime
        }).catch(error => {
          console.error('Failed to publish consent status update event:', error);
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
        Status: updatedConsent.Status,
        StatusUpdateDateTime: updatedConsent.StatusUpdateDateTime
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}/domestic-payment-consents/${consentId}`
      },
      Meta: {
        TotalPages: 1
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating consent status:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};