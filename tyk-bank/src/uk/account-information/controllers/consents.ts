import { Request, Response } from 'express';
import { 
  getAllConsents, 
  getConsentById, 
  createConsent, 
  updateConsentStatus, 
  deleteConsent 
} from '../data/pg-consents';
import { ConsentRequest, ConsentStatus, PermissionType } from '../models/consent';
import { Links, Meta } from '../../../common/types/common';

/**
 * Create a new consent
 * @param req Express request
 * @param res Express response
 */
export const createAccountAccessConsent = async (req: Request, res: Response) => {
  try {
    const consentRequest = req.body as ConsentRequest;
    
    // Validate request body
    if (!consentRequest?.Data?.Permissions || !Array.isArray(consentRequest.Data.Permissions) || consentRequest.Data.Permissions.length === 0) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'Permissions array is required and must not be empty'
      });
    }
    
    // Validate permissions
    const invalidPermissions = consentRequest.Data.Permissions.filter(
      permission => !Object.values(PermissionType).includes(permission as PermissionType)
    );
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        ErrorCode: 'InvalidPermission',
        ErrorMessage: `Invalid permissions: ${invalidPermissions.join(', ')}`
      });
    }
    
    // Create new consent
    const newConsent = await createConsent(
      consentRequest.Data.Permissions as PermissionType[],
      consentRequest.Data.ExpirationDateTime,
      consentRequest.Data.TransactionFromDateTime,
      consentRequest.Data.TransactionToDateTime
    );
    
    const response = {
      Data: {
        ConsentId: newConsent.ConsentId,
        CreationDateTime: newConsent.CreationDateTime,
        Status: newConsent.Status,
        StatusUpdateDateTime: newConsent.StatusUpdateDateTime,
        Permissions: newConsent.Permissions,
        ExpirationDateTime: newConsent.ExpirationDateTime,
        TransactionFromDateTime: newConsent.TransactionFromDateTime,
        TransactionToDateTime: newConsent.TransactionToDateTime
      },
      Risk: {},
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating consent:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get consent by ID
 * @param req Express request
 * @param res Express response
 */
export const getAccountAccessConsent = async (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    const consent = await getConsentById(consentId);
    
    if (!consent) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Consent with ID ${consentId} not found`
      });
    }
    
    const response = {
      Data: {
        ConsentId: consent.ConsentId,
        CreationDateTime: consent.CreationDateTime,
        Status: consent.Status,
        StatusUpdateDateTime: consent.StatusUpdateDateTime,
        Permissions: consent.Permissions,
        ExpirationDateTime: consent.ExpirationDateTime,
        TransactionFromDateTime: consent.TransactionFromDateTime,
        TransactionToDateTime: consent.TransactionToDateTime
      },
      Risk: {},
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting consent by ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Delete consent by ID
 * @param req Express request
 * @param res Express response
 */
export const deleteAccountAccessConsent = async (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    const consent = await getConsentById(consentId);
    
    if (!consent) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Consent with ID ${consentId} not found`
      });
    }
    
    // Delete consent
    const deleted = await deleteConsent(consentId);
    
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(500).json({
        ErrorCode: 'InternalServerError',
        ErrorMessage: 'Failed to delete consent'
      });
    }
  } catch (error) {
    console.error('Error deleting consent:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};