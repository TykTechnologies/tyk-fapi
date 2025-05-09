import { v4 as uuidv4 } from 'uuid';
import { 
  DomesticPaymentConsent, 
  ConsentStatus, 
  DomesticPaymentInitiation 
} from '../models/consent';

/**
 * Mock payment consents data
 */
export const paymentConsents: DomesticPaymentConsent[] = [
  {
    ConsentId: 'pcon-001',
    CreationDateTime: '2023-05-01T10:00:00+00:00',
    Status: ConsentStatus.AUTHORISED,
    StatusUpdateDateTime: '2023-05-01T10:05:00+00:00',
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
    },
    Risk: {}
  },
  {
    ConsentId: 'pcon-002',
    CreationDateTime: '2023-05-02T14:30:00+00:00',
    Status: ConsentStatus.AWAITING_AUTHORISATION,
    StatusUpdateDateTime: '2023-05-02T14:30:00+00:00',
    Initiation: {
      InstructionIdentification: 'PAYREF-45321',
      EndToEndIdentification: 'BILLINV-45789',
      InstructedAmount: {
        Amount: '256.99',
        Currency: 'GBP'
      },
      CreditorAccount: {
        SchemeName: 'UK.OBIE.SortCodeAccountNumber',
        Identification: '20051899712564',
        Name: 'Merchant XYZ Ltd'
      },
      RemittanceInformation: {
        Reference: 'INV-45789'
      }
    },
    Risk: {}
  }
];

/**
 * Get all payment consents
 */
export const getAllPaymentConsents = (): DomesticPaymentConsent[] => {
  return paymentConsents;
};

/**
 * Get payment consent by ID
 */
export const getPaymentConsentById = (consentId: string): DomesticPaymentConsent | undefined => {
  return paymentConsents.find(consent => consent.ConsentId === consentId);
};

/**
 * Create a new payment consent
 */
export const createPaymentConsent = (
  initiation: DomesticPaymentInitiation,
  risk: Record<string, unknown>
): DomesticPaymentConsent => {
  const now = new Date().toISOString();
  const newConsent: DomesticPaymentConsent = {
    ConsentId: `pcon-${uuidv4().substring(0, 8)}`,
    CreationDateTime: now,
    Status: ConsentStatus.AWAITING_AUTHORISATION,
    StatusUpdateDateTime: now,
    Initiation: initiation,
    Risk: risk,
    ExpirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
  
  paymentConsents.push(newConsent);
  return newConsent;
};

/**
 * Update payment consent status
 */
export const updatePaymentConsentStatus = (consentId: string, status: ConsentStatus): DomesticPaymentConsent | undefined => {
  const consent = getPaymentConsentById(consentId);
  
  if (consent) {
    consent.Status = status;
    consent.StatusUpdateDateTime = new Date().toISOString();
  }
  
  return consent;
};

/**
 * Delete payment consent
 */
export const deletePaymentConsent = (consentId: string): boolean => {
  const index = paymentConsents.findIndex(consent => consent.ConsentId === consentId);
  
  if (index !== -1) {
    paymentConsents.splice(index, 1);
    return true;
  }
  
  return false;
};

/**
 * Check if funds are available for a payment consent
 * This is a mock implementation that always returns true for authorized consents
 */
export const checkFundsAvailability = (consentId: string): boolean => {
  const consent = getPaymentConsentById(consentId);
  
  if (consent && consent.Status === ConsentStatus.AUTHORISED) {
    // In a real implementation, this would check if the debtor account has sufficient funds
    return true;
  }
  
  return false;
};