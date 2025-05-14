import { Request, Response } from 'express';
import {
  createPaymentConsent,
  getPaymentConsentById,
  checkFundsAvailability,
  updatePaymentConsentStatus
} from '../data/consents';
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
export const createDomesticPaymentConsent = (req: Request, res: Response) => {
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
    
    if (!Initiation.InstructedAmount || !Initiation.InstructedAmount.Amount || !Initiation.InstructedAmount.Currency) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'InstructedAmount with Amount and Currency is required'
      });
    }
    
    if (!Initiation.CreditorAccount || !Initiation.CreditorAccount.SchemeName || 
        !Initiation.CreditorAccount.Identification || !Initiation.CreditorAccount.Name) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'CreditorAccount with SchemeName, Identification, and Name is required'
      });
    }
    
    // Create new consent
    const newConsent = createPaymentConsent(
      Initiation,
      consentRequest.Risk || {}
    );
    
    // The consent will remain in AwaitingAuthorisation status
    // until explicitly authorized via the authorization endpoint
    
    // Publish event for consent creation
    const eventType = mapConsentStatusToEventType(ConsentStatus.AWAITING_AUTHORISATION);
    if (eventType) {
      publishPaymentConsentEvent(eventType, newConsent.ConsentId, {
        consentId: newConsent.ConsentId,
        status: newConsent.Status,
        timestamp: newConsent.CreationDateTime,
        amount: newConsent.Initiation.InstructedAmount.Amount,
        currency: newConsent.Initiation.InstructedAmount.Currency
      }).catch(error => {
        console.error('Failed to publish consent created event:', error);
      });
    }
    
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
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}/${newConsent.ConsentId}`,
        Authorize: `${req.protocol}://${req.get('host')}/domestic-payment-consents/${newConsent.ConsentId}/authorize`
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
export const getDomesticPaymentConsent = (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    const consent = getPaymentConsentById(consentId);
    
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
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting domestic payment consent by ID:', error);
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
export const getDomesticPaymentConsentFundsConfirmation = (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    const consent = getPaymentConsentById(consentId);
    
    if (!consent) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment consent with ID ${consentId} not found`
      });
    }
    
    // Check funds availability
    const fundsAvailable = checkFundsAvailability(consentId);
    
    const response = {
      Data: {
        FundsAvailableResult: {
          FundsAvailable: fundsAvailable,
          FundsAvailableDateTime: new Date().toISOString()
        }
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    // Publish funds confirmation event
    publishFundsConfirmationEvent(consentId, {
      consentId,
      fundsAvailable,
      timestamp: response.Data.FundsAvailableResult.FundsAvailableDateTime
    }).catch((error: Error) => {
      console.error('Failed to publish funds confirmation event:', error);
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking funds confirmation:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};