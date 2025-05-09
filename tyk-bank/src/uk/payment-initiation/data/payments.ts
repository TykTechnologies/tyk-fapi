import { v4 as uuidv4 } from 'uuid';
import { 
  DomesticPayment, 
  PaymentStatus 
} from '../models/payment';
import { 
  getPaymentConsentById, 
  updatePaymentConsentStatus 
} from './consents';
import { ConsentStatus } from '../models/consent';

/**
 * Mock payments data
 */
export const payments: DomesticPayment[] = [
  {
    DomesticPaymentId: 'p-001',
    ConsentId: 'pcon-001',
    CreationDateTime: '2023-05-01T10:10:00+00:00',
    Status: PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED,
    StatusUpdateDateTime: '2023-05-01T10:15:00+00:00',
    ExpectedExecutionDateTime: '2023-05-01T10:10:00+00:00',
    ExpectedSettlementDateTime: '2023-05-01T10:15:00+00:00',
    Initiation: {
      InstructionIdentification: 'ACME412',
      EndToEndIdentification: 'FRESCO.21302.GFX.20',
      InstructedAmount: {
        Amount: '165.88',
        Currency: 'GBP'
      },
      CreditorAccount: {
        SchemeName: 'UK.OBIE.SortCodeAccountNumber',
        Identification: '08080021325698',
        Name: 'ACME Inc',
        SecondaryIdentification: '0002'
      },
      RemittanceInformation: {
        Reference: 'FRESCO-101',
        Unstructured: 'Internal ops code 5120101'
      }
    }
  }
];

/**
 * Get all payments
 */
export const getAllPayments = (): DomesticPayment[] => {
  return payments;
};

/**
 * Get payment by ID
 */
export const getPaymentById = (paymentId: string): DomesticPayment | undefined => {
  return payments.find(payment => payment.DomesticPaymentId === paymentId);
};

/**
 * Get payments by consent ID
 */
export const getPaymentsByConsentId = (consentId: string): DomesticPayment[] => {
  return payments.filter(payment => payment.ConsentId === consentId);
};

/**
 * Create a new payment
 */
export const createPayment = (consentId: string): DomesticPayment | undefined => {
  const consent = getPaymentConsentById(consentId);
  
  if (!consent) {
    return undefined;
  }
  
  // Check if consent is in the right state
  if (consent.Status !== ConsentStatus.AUTHORISED) {
    return undefined;
  }
  
  const now = new Date().toISOString();
  const executionDateTime = now;
  const settlementDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes later
  
  const newPayment: DomesticPayment = {
    DomesticPaymentId: `p-${uuidv4().substring(0, 8)}`,
    ConsentId: consentId,
    CreationDateTime: now,
    Status: PaymentStatus.ACCEPTED_SETTLEMENT_IN_PROCESS,
    StatusUpdateDateTime: now,
    ExpectedExecutionDateTime: executionDateTime,
    ExpectedSettlementDateTime: settlementDateTime,
    Initiation: consent.Initiation
  };
  
  payments.push(newPayment);
  
  // Update consent status to CONSUMED
  updatePaymentConsentStatus(consentId, ConsentStatus.CONSUMED);
  
  // In a real implementation, we would initiate the actual payment process here
  // For this mock implementation, we'll simulate the payment completing after a short delay
  setTimeout(() => {
    updatePaymentStatus(newPayment.DomesticPaymentId, PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED);
  }, 2000);
  
  return newPayment;
};

/**
 * Update payment status
 */
export const updatePaymentStatus = (paymentId: string, status: PaymentStatus): DomesticPayment | undefined => {
  const payment = getPaymentById(paymentId);
  
  if (payment) {
    payment.Status = status;
    payment.StatusUpdateDateTime = new Date().toISOString();
  }
  
  return payment;
};

/**
 * Get payment details
 */
export const getPaymentDetails = (paymentId: string): {
  PaymentStatus: PaymentStatus;
  PaymentStatusUpdateDateTime: string;
  ExpectedExecutionDateTime?: string;
  ExpectedSettlementDateTime?: string;
} | undefined => {
  const payment = getPaymentById(paymentId);
  
  if (!payment) {
    return undefined;
  }
  
  return {
    PaymentStatus: payment.Status,
    PaymentStatusUpdateDateTime: payment.StatusUpdateDateTime,
    ExpectedExecutionDateTime: payment.ExpectedExecutionDateTime,
    ExpectedSettlementDateTime: payment.ExpectedSettlementDateTime
  };
};