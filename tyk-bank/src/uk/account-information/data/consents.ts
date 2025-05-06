import { v4 as uuidv4 } from 'uuid';
import { Consent, ConsentStatus, PermissionType } from '../models/consent';

/**
 * Mock consents data
 */
export const consents: Consent[] = [
  {
    ConsentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    CreationDateTime: '2023-04-01T10:00:00+00:00',
    Status: ConsentStatus.AUTHORISED,
    StatusUpdateDateTime: '2023-04-01T10:05:00+00:00',
    Permissions: [
      PermissionType.READACCOUNTSBASIC,
      PermissionType.READBALANCES,
      PermissionType.READTRANSACTIONSBASIC
    ],
    ExpirationDateTime: '2024-04-01T10:00:00+00:00'
  },
  {
    ConsentId: 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj',
    CreationDateTime: '2023-03-15T14:30:00+00:00',
    Status: ConsentStatus.AUTHORISED,
    StatusUpdateDateTime: '2023-03-15T14:35:00+00:00',
    Permissions: [
      PermissionType.READACCOUNTSDETAIL,
      PermissionType.READBALANCES,
      PermissionType.READTRANSACTIONSDETAIL,
      PermissionType.READBENEFICIARIESDETAIL,
      PermissionType.READSTANDINGORDERSDETAIL,
      PermissionType.READDIRECTDEBITS
    ],
    ExpirationDateTime: '2024-03-15T14:30:00+00:00'
  },
  {
    ConsentId: 'kkkkkkkk-llll-mmmm-nnnn-oooooooooooo',
    CreationDateTime: '2023-02-20T09:15:00+00:00',
    Status: ConsentStatus.EXPIRED,
    StatusUpdateDateTime: '2023-03-20T09:15:00+00:00',
    Permissions: [
      PermissionType.READACCOUNTSBASIC,
      PermissionType.READBALANCES
    ],
    ExpirationDateTime: '2023-03-20T09:15:00+00:00'
  },
  {
    ConsentId: 'pppppppp-qqqq-rrrr-ssss-tttttttttttt',
    CreationDateTime: '2023-04-02T16:45:00+00:00',
    Status: ConsentStatus.AWAITING_AUTHORISATION,
    StatusUpdateDateTime: '2023-04-02T16:45:00+00:00',
    Permissions: [
      PermissionType.READACCOUNTSDETAIL,
      PermissionType.READBALANCES,
      PermissionType.READTRANSACTIONSDETAIL
    ],
    ExpirationDateTime: '2024-04-02T16:45:00+00:00'
  },
  {
    ConsentId: 'uuuuuuuu-vvvv-wwww-xxxx-yyyyyyyyyyyy',
    CreationDateTime: '2023-03-10T11:20:00+00:00',
    Status: ConsentStatus.REJECTED,
    StatusUpdateDateTime: '2023-03-10T11:25:00+00:00',
    Permissions: [
      PermissionType.READACCOUNTSDETAIL,
      PermissionType.READBALANCES,
      PermissionType.READTRANSACTIONSDETAIL,
      PermissionType.READSTANDINGORDERSDETAIL
    ],
    ExpirationDateTime: '2024-03-10T11:20:00+00:00'
  }
];

/**
 * Get all consents
 */
export const getAllConsents = (): Consent[] => {
  return consents;
};

/**
 * Get consent by ID
 */
export const getConsentById = (consentId: string): Consent | undefined => {
  return consents.find(consent => consent.ConsentId === consentId);
};

/**
 * Create a new consent
 */
export const createConsent = (
  permissions: PermissionType[],
  expirationDateTime?: string,
  transactionFromDateTime?: string,
  transactionToDateTime?: string
): Consent => {
  const now = new Date().toISOString();
  const newConsent: Consent = {
    ConsentId: uuidv4(),
    CreationDateTime: now,
    Status: ConsentStatus.AWAITING_AUTHORISATION,
    StatusUpdateDateTime: now,
    Permissions: permissions,
    ExpirationDateTime: expirationDateTime,
    TransactionFromDateTime: transactionFromDateTime,
    TransactionToDateTime: transactionToDateTime
  };
  
  consents.push(newConsent);
  return newConsent;
};

/**
 * Update consent status
 */
export const updateConsentStatus = (consentId: string, status: ConsentStatus): Consent | undefined => {
  const consent = getConsentById(consentId);
  
  if (consent) {
    consent.Status = status;
    consent.StatusUpdateDateTime = new Date().toISOString();
  }
  
  return consent;
};

/**
 * Delete consent
 */
export const deleteConsent = (consentId: string): boolean => {
  const index = consents.findIndex(consent => consent.ConsentId === consentId);
  
  if (index !== -1) {
    consents.splice(index, 1);
    return true;
  }
  
  return false;
};