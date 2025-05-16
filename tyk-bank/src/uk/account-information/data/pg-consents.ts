import { v4 as uuidv4 } from 'uuid';
import { 
  Consent, 
  ConsentStatus, 
  PermissionType 
} from '../models/consent';
import db from '../../../common/db/connection';

/**
 * Get all consents from the database
 * @returns Array of all consents
 */
export const getAllConsents = async (): Promise<Consent[]> => {
  try {
    const query = `
      SELECT * FROM account_access_consents
      ORDER BY creation_date_time DESC
    `;
    
    const result = await db.query(query);
    
    return result.rows.map((row: any) => ({
      ConsentId: row.consent_id,
      Status: row.status as ConsentStatus,
      CreationDateTime: row.creation_date_time,
      StatusUpdateDateTime: row.status_update_date_time,
      ExpirationDateTime: row.expiration_date_time,
      TransactionFromDateTime: row.transaction_from_date_time,
      TransactionToDateTime: row.transaction_to_date_time,
      Permissions: row.permissions
    }));
  } catch (error) {
    console.error('Error getting all consents:', error);
    throw error;
  }
};

/**
 * Get consent by ID from the database
 * @param consentId Consent ID
 * @returns Consent or undefined if not found
 */
export const getConsentById = async (consentId: string): Promise<Consent | undefined> => {
  try {
    const query = `
      SELECT * FROM account_access_consents
      WHERE consent_id = $1
    `;
    
    const values = [consentId];
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    
    return {
      ConsentId: row.consent_id,
      Status: row.status as ConsentStatus,
      CreationDateTime: row.creation_date_time,
      StatusUpdateDateTime: row.status_update_date_time,
      ExpirationDateTime: row.expiration_date_time,
      TransactionFromDateTime: row.transaction_from_date_time,
      TransactionToDateTime: row.transaction_to_date_time,
      Permissions: row.permissions
    };
  } catch (error) {
    console.error('Error getting consent by ID:', error);
    throw error;
  }
};

/**
 * Create a new consent in the database
 * @param permissions Array of permissions
 * @param expirationDateTime Expiration date and time
 * @param transactionFromDateTime Transaction from date and time
 * @param transactionToDateTime Transaction to date and time
 * @returns The created consent
 */
export const createConsent = async (
  permissions: PermissionType[],
  expirationDateTime?: string,
  transactionFromDateTime?: string,
  transactionToDateTime?: string
): Promise<Consent> => {
  try {
    const consentId = `acon-${uuidv4().substring(0, 8)}`;
    const now = new Date();
    
    const consent: Consent = {
      ConsentId: consentId,
      Status: ConsentStatus.AWAITING_AUTHORISATION,
      CreationDateTime: now.toISOString(),
      StatusUpdateDateTime: now.toISOString(),
      ExpirationDateTime: expirationDateTime,
      TransactionFromDateTime: transactionFromDateTime,
      TransactionToDateTime: transactionToDateTime,
      Permissions: permissions
    };
    
    const query = `
      INSERT INTO account_access_consents (
        consent_id, status, creation_date_time, status_update_date_time,
        expiration_date_time, transaction_from_date_time, transaction_to_date_time,
        permissions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      consent.ConsentId,
      consent.Status,
      consent.CreationDateTime,
      consent.StatusUpdateDateTime,
      consent.ExpirationDateTime,
      consent.TransactionFromDateTime,
      consent.TransactionToDateTime,
      JSON.stringify(consent.Permissions)
    ];
    
    await db.query(query, values);
    
    return consent;
  } catch (error) {
    console.error('Error creating consent:', error);
    throw error;
  }
};

/**
 * Update consent status in the database
 * @param consentId Consent ID
 * @param status New status
 * @returns Updated consent or undefined if not found
 */
export const updateConsentStatus = async (
  consentId: string,
  status: ConsentStatus
): Promise<Consent | undefined> => {
  try {
    const now = new Date();
    
    const query = `
      UPDATE account_access_consents
      SET status = $1, status_update_date_time = $2
      WHERE consent_id = $3
      RETURNING *
    `;
    
    const values = [status, now.toISOString(), consentId];
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    
    return {
      ConsentId: row.consent_id,
      Status: row.status as ConsentStatus,
      CreationDateTime: row.creation_date_time,
      StatusUpdateDateTime: row.status_update_date_time,
      ExpirationDateTime: row.expiration_date_time,
      TransactionFromDateTime: row.transaction_from_date_time,
      TransactionToDateTime: row.transaction_to_date_time,
      Permissions: row.permissions
    };
  } catch (error) {
    console.error('Error updating consent status:', error);
    throw error;
  }
};

/**
 * Delete consent from the database
 * @param consentId Consent ID
 * @returns True if deleted, false if not found
 */
export const deleteConsent = async (consentId: string): Promise<boolean> => {
  try {
    const query = `
      DELETE FROM account_access_consents
      WHERE consent_id = $1
      RETURNING *
    `;
    
    const values = [consentId];
    const result = await db.query(query, values);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting consent:', error);
    throw error;
  }
};