import { v4 as uuidv4 } from 'uuid';
import db from '../../../common/db/connection';
import { 
  DomesticPaymentConsent, 
  ConsentStatus, 
  DomesticPaymentInitiation 
} from '../models/consent';

/**
 * Convert database row to DomesticPaymentConsent model
 */
const rowToPaymentConsent = (row: any): DomesticPaymentConsent => {
  const consent: DomesticPaymentConsent = {
    ConsentId: row.consent_id,
    CreationDateTime: row.creation_date_time.toISOString(),
    Status: row.status as ConsentStatus,
    StatusUpdateDateTime: row.status_update_date_time.toISOString(),
    Initiation: {
      InstructionIdentification: row.instruction_identification,
      EndToEndIdentification: row.end_to_end_identification,
      InstructedAmount: {
        Amount: row.instructed_amount_amount.toString(),
        Currency: row.instructed_amount_currency
      },
      CreditorAccount: {
        SchemeName: row.creditor_account_scheme_name,
        Identification: row.creditor_account_identification,
        Name: row.creditor_account_name,
        SecondaryIdentification: row.creditor_account_secondary_identification
      },
      RemittanceInformation: {
        Reference: undefined,
        Unstructured: undefined
      }
    },
    Risk: {}
  };

  // Add optional fields
  if (row.expiration_date_time) {
    consent.ExpirationDateTime = row.expiration_date_time.toISOString();
  }

  if (row.debtor_account_scheme_name) {
    consent.Initiation.DebtorAccount = {
      SchemeName: row.debtor_account_scheme_name,
      Identification: row.debtor_account_identification,
      Name: row.debtor_account_name
    };

    if (row.debtor_account_secondary_identification) {
      consent.Initiation.DebtorAccount.SecondaryIdentification = row.debtor_account_secondary_identification;
    }
  }

  if (row.remittance_information_reference) {
    consent.Initiation.RemittanceInformation!.Reference = row.remittance_information_reference;
  }

  if (row.remittance_information_unstructured) {
    consent.Initiation.RemittanceInformation!.Unstructured = row.remittance_information_unstructured;
  }

  return consent;
};

/**
 * Get all payment consents
 */
export const getAllPaymentConsents = async (): Promise<DomesticPaymentConsent[]> => {
  try {
    const result = await db.query('SELECT * FROM payment_consents');
    return result.rows.map(rowToPaymentConsent);
  } catch (error) {
    console.error('Error getting all payment consents:', error);
    throw error;
  }
};

/**
 * Get payment consent by ID
 */
export const getPaymentConsentById = async (consentId: string): Promise<DomesticPaymentConsent | undefined> => {
  try {
    const result = await db.query(
      'SELECT * FROM payment_consents WHERE consent_id = $1',
      [consentId]
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToPaymentConsent(result.rows[0]);
  } catch (error) {
    console.error(`Error getting payment consent by ID ${consentId}:`, error);
    throw error;
  }
};

/**
 * Create a new payment consent
 */
export const createPaymentConsent = async (
  initiation: DomesticPaymentInitiation,
  risk: Record<string, unknown>
): Promise<DomesticPaymentConsent> => {
  try {
    const now = new Date();
    const consentId = `pcon-${uuidv4().substring(0, 8)}`;
    const expirationDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Start building the query
    let query = `
      INSERT INTO payment_consents (
        consent_id, status, creation_date_time, status_update_date_time,
        expiration_date_time, instruction_identification, end_to_end_identification,
        instructed_amount_amount, instructed_amount_currency,
        creditor_account_scheme_name, creditor_account_identification, creditor_account_name
    `;
    
    // Add optional fields to the column list
    if (initiation.CreditorAccount.SecondaryIdentification) {
      query += `, creditor_account_secondary_identification`;
    }
    
    if (initiation.DebtorAccount) {
      query += `, debtor_account_scheme_name, debtor_account_identification, debtor_account_name`;
      if (initiation.DebtorAccount.SecondaryIdentification) {
        query += `, debtor_account_secondary_identification`;
      }
    }
    
    if (initiation.RemittanceInformation?.Reference) {
      query += `, remittance_information_reference`;
    }
    
    if (initiation.RemittanceInformation?.Unstructured) {
      query += `, remittance_information_unstructured`;
    }
    
    // Start values section
    query += `) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12`;
    
    // Create params array
    const params: any[] = [
      consentId,
      ConsentStatus.AWAITING_AUTHORISATION,
      now,
      now,
      expirationDateTime,
      initiation.InstructionIdentification,
      initiation.EndToEndIdentification,
      parseFloat(initiation.InstructedAmount.Amount),
      initiation.InstructedAmount.Currency,
      initiation.CreditorAccount.SchemeName,
      initiation.CreditorAccount.Identification,
      initiation.CreditorAccount.Name
    ];
    
    // Add optional params
    if (initiation.CreditorAccount.SecondaryIdentification) {
      query += `, $${params.length + 1}`;
      params.push(initiation.CreditorAccount.SecondaryIdentification);
    }
    
    if (initiation.DebtorAccount) {
      query += `, $${params.length + 1}, $${params.length + 2}, $${params.length + 3}`;
      params.push(initiation.DebtorAccount.SchemeName);
      params.push(initiation.DebtorAccount.Identification);
      params.push(initiation.DebtorAccount.Name);
      
      if (initiation.DebtorAccount.SecondaryIdentification) {
        query += `, $${params.length + 1}`;
        params.push(initiation.DebtorAccount.SecondaryIdentification);
      }
    }
    
    if (initiation.RemittanceInformation?.Reference) {
      query += `, $${params.length + 1}`;
      params.push(initiation.RemittanceInformation.Reference);
    }
    
    if (initiation.RemittanceInformation?.Unstructured) {
      query += `, $${params.length + 1}`;
      params.push(initiation.RemittanceInformation.Unstructured);
    }
    
    // Finish the query
    query += `) RETURNING *`;
    
    const result = await db.query(query, params);
    
    return rowToPaymentConsent(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment consent:', error);
    throw error;
  }
};

/**
 * Update payment consent status
 */
export const updatePaymentConsentStatus = async (
  consentId: string, 
  status: ConsentStatus
): Promise<DomesticPaymentConsent | undefined> => {
  try {
    const now = new Date();
    
    const result = await db.query(
      `UPDATE payment_consents 
       SET status = $1, status_update_date_time = $2 
       WHERE consent_id = $3 
       RETURNING *`,
      [status, now, consentId]
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToPaymentConsent(result.rows[0]);
  } catch (error) {
    console.error(`Error updating payment consent status for ${consentId}:`, error);
    throw error;
  }
};

/**
 * Delete payment consent
 */
export const deletePaymentConsent = async (consentId: string): Promise<boolean> => {
  try {
    const result = await db.query(
      'DELETE FROM payment_consents WHERE consent_id = $1 RETURNING *',
      [consentId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error deleting payment consent ${consentId}:`, error);
    throw error;
  }
};

/**
 * Check if funds are available for a payment consent
 * This is a mock implementation that always returns true for authorized consents
 */
export const checkFundsAvailability = async (consentId: string): Promise<boolean> => {
  try {
    const consent = await getPaymentConsentById(consentId);
    
    if (consent && consent.Status === ConsentStatus.AUTHORISED) {
      // In a real implementation, this would check if the debtor account has sufficient funds
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking funds availability for consent ${consentId}:`, error);
    throw error;
  }
};