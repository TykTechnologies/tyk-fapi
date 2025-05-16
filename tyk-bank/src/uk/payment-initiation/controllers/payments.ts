import { Request, Response } from 'express';
import { 
  createPayment, 
  getPaymentById, 
  getPaymentDetails 
} from '../data/pg-payments';
import { getPaymentConsentById } from '../data/pg-consents';
import { DomesticPaymentRequest } from '../models/payment';
import { ConsentStatus } from '../models/consent';
import { Links, Meta } from '../../../common/types/common';

/**
 * Create a new domestic payment
 * @param req Express request
 * @param res Express response
 */
export const createDomesticPayment = async (req: Request, res: Response) => {
  try {
    console.log('=== Starting domestic payment creation ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const paymentRequest = req.body as DomesticPaymentRequest;
    
    // Validate request body
    if (!paymentRequest?.Data?.ConsentId) {
      console.log('Error: ConsentId is missing in the request');
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'ConsentId is required'
      });
    }
    
    const { ConsentId } = paymentRequest.Data;
    console.log(`Processing payment for ConsentId: ${ConsentId}`);
    
    // Check if consent exists
    const consent = await getPaymentConsentById(ConsentId);
    console.log(`Consent lookup result: ${consent ? 'Found' : 'Not found'}, status: ${consent?.Status}`);
    
    if (!consent) {
      console.log(`Consent with ID ${ConsentId} not found`);
      return res.status(400).json({
        ErrorCode: 'InvalidConsentId',
        ErrorMessage: `Consent with ID ${ConsentId} not found`
      });
    }
    
    // Check if consent is in the right state
    if (consent.Status !== ConsentStatus.AUTHORISED) {
      console.log(`Consent with ID ${ConsentId} has invalid status: ${consent.Status}, expected ${ConsentStatus.AUTHORISED}`);
      return res.status(400).json({
        ErrorCode: 'InvalidConsentStatus',
        ErrorMessage: `Consent with ID ${ConsentId} has status ${consent.Status}, expected ${ConsentStatus.AUTHORISED}`
      });
    }
    
    // Create new payment
    console.log('Consent validation passed, creating payment...');
    const newPayment = await createPayment(ConsentId);
    console.log('Payment creation result:', newPayment ? 'Success' : 'Failed');
    
    if (!newPayment) {
      console.log('Payment creation returned null or undefined');
      return res.status(400).json({
        ErrorCode: 'PaymentCreationFailed',
        ErrorMessage: 'Failed to create payment'
      });
    }
    
    console.log('Building response with payment details');
    const response = {
      Data: {
        DomesticPaymentId: newPayment.DomesticPaymentId,
        ConsentId: newPayment.ConsentId,
        CreationDateTime: newPayment.CreationDateTime,
        Status: newPayment.Status,
        StatusUpdateDateTime: newPayment.StatusUpdateDateTime,
        ExpectedExecutionDateTime: newPayment.ExpectedExecutionDateTime,
        ExpectedSettlementDateTime: newPayment.ExpectedSettlementDateTime,
        Initiation: newPayment.Initiation
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}/${newPayment.DomesticPaymentId}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    console.log('Sending successful response with status 201');
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating domestic payment:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error type');
    
    // More specific error message for debugging
    const errorMessage = error instanceof Error
      ? `Failed to create payment: ${error.message}`
      : 'An internal server error occurred';
    
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: errorMessage
    });
  }
};

/**
 * Get domestic payment by ID
 * @param req Express request
 * @param res Express response
 */
export const getDomesticPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await getPaymentById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment with ID ${paymentId} not found`
      });
    }
    
    const response = {
      Data: {
        DomesticPaymentId: payment.DomesticPaymentId,
        ConsentId: payment.ConsentId,
        CreationDateTime: payment.CreationDateTime,
        Status: payment.Status,
        StatusUpdateDateTime: payment.StatusUpdateDateTime,
        ExpectedExecutionDateTime: payment.ExpectedExecutionDateTime,
        ExpectedSettlementDateTime: payment.ExpectedSettlementDateTime,
        Charges: payment.Charges,
        Initiation: payment.Initiation,
        MultiAuthorisation: payment.MultiAuthorisation
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting domestic payment by ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get domestic payment details
 * @param req Express request
 * @param res Express response
 */
export const getDomesticPaymentDetails = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const paymentDetails = await getPaymentDetails(paymentId);
    
    if (!paymentDetails) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Domestic payment with ID ${paymentId} not found`
      });
    }
    
    const response = {
      Data: {
        PaymentStatus: paymentDetails.PaymentStatus,
        PaymentStatusUpdateDateTime: paymentDetails.PaymentStatusUpdateDateTime,
        ExpectedExecutionDateTime: paymentDetails.ExpectedExecutionDateTime,
        ExpectedSettlementDateTime: paymentDetails.ExpectedSettlementDateTime
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting domestic payment details:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};