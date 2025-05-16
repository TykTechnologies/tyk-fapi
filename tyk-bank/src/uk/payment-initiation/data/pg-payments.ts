import { v4 as uuidv4 } from 'uuid';
import db from '../../../common/db/connection';
import {
  DomesticPayment,
  PaymentStatus
} from '../models/payment';
import {
  getPaymentConsentById,
  updatePaymentConsentStatus
} from './pg-consents';
import { ConsentStatus } from '../models/consent';
import { createTransaction } from '../../account-information/data/pg-transactions';
import { CreditDebitIndicator } from '../../account-information/models/balance';
import { getAccountByIdentification } from '../../account-information/data/pg-accounts';
import { TransactionStatus } from '../../account-information/models/transaction';
import {
  publishPaymentEvent,
  mapPaymentStatusToEventType,
  EventType
} from '../services/event-publisher';

/**
 * Convert database row to DomesticPayment model
 */
const rowToPayment = (row: any): DomesticPayment => {
  return {
    DomesticPaymentId: row.payment_id,
    ConsentId: row.consent_id,
    CreationDateTime: row.creation_date_time.toISOString(),
    Status: row.status as PaymentStatus,
    StatusUpdateDateTime: row.status_update_date_time.toISOString(),
    ExpectedExecutionDateTime: row.expected_execution_date_time?.toISOString(),
    ExpectedSettlementDateTime: row.expected_settlement_date_time?.toISOString(),
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
        Reference: row.remittance_information_reference,
        Unstructured: row.remittance_information_unstructured
      }
    }
  };
};

/**
 * Get all payments
 */
export const getAllPayments = async (): Promise<DomesticPayment[]> => {
  try {
    // Join with payment_consents to get the initiation details
    const result = await db.query(`
      SELECT 
        p.payment_id, p.consent_id, p.creation_date_time, p.status, 
        p.status_update_date_time, p.expected_execution_date_time, p.expected_settlement_date_time,
        pc.instruction_identification, pc.end_to_end_identification,
        pc.instructed_amount_amount, pc.instructed_amount_currency,
        pc.creditor_account_scheme_name, pc.creditor_account_identification, pc.creditor_account_name, 
        pc.creditor_account_secondary_identification,
        pc.remittance_information_reference, pc.remittance_information_unstructured
      FROM 
        payments p
      JOIN 
        payment_consents pc ON p.consent_id = pc.consent_id
    `);
    
    return result.rows.map(rowToPayment);
  } catch (error) {
    console.error('Error getting all payments:', error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<DomesticPayment | undefined> => {
  try {
    // Join with payment_consents to get the initiation details
    const result = await db.query(`
      SELECT 
        p.payment_id, p.consent_id, p.creation_date_time, p.status, 
        p.status_update_date_time, p.expected_execution_date_time, p.expected_settlement_date_time,
        pc.instruction_identification, pc.end_to_end_identification,
        pc.instructed_amount_amount, pc.instructed_amount_currency,
        pc.creditor_account_scheme_name, pc.creditor_account_identification, pc.creditor_account_name, 
        pc.creditor_account_secondary_identification,
        pc.remittance_information_reference, pc.remittance_information_unstructured
      FROM 
        payments p
      JOIN 
        payment_consents pc ON p.consent_id = pc.consent_id
      WHERE 
        p.payment_id = $1
    `, [paymentId]);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToPayment(result.rows[0]);
  } catch (error) {
    console.error(`Error getting payment by ID ${paymentId}:`, error);
    throw error;
  }
};

/**
 * Get payments by consent ID
 */
export const getPaymentsByConsentId = async (consentId: string): Promise<DomesticPayment[]> => {
  try {
    // Join with payment_consents to get the initiation details
    const result = await db.query(`
      SELECT 
        p.payment_id, p.consent_id, p.creation_date_time, p.status, 
        p.status_update_date_time, p.expected_execution_date_time, p.expected_settlement_date_time,
        pc.instruction_identification, pc.end_to_end_identification,
        pc.instructed_amount_amount, pc.instructed_amount_currency,
        pc.creditor_account_scheme_name, pc.creditor_account_identification, pc.creditor_account_name, 
        pc.creditor_account_secondary_identification,
        pc.remittance_information_reference, pc.remittance_information_unstructured
      FROM 
        payments p
      JOIN 
        payment_consents pc ON p.consent_id = pc.consent_id
      WHERE 
        p.consent_id = $1
    `, [consentId]);
    
    return result.rows.map(rowToPayment);
  } catch (error) {
    console.error(`Error getting payments by consent ID ${consentId}:`, error);
    throw error;
  }
};

/**
 * Create a new payment
 */
export const createPayment = async (consentId: string): Promise<DomesticPayment | undefined> => {
  console.log(`=== Starting payment creation for consent ID: ${consentId} ===`);
  
  // Use a transaction to ensure all operations succeed or fail together
  return await db.transaction(async (client) => {
    try {
      console.log('Fetching payment consent details...');
      const consent = await getPaymentConsentById(consentId);
      
      if (!consent) {
        console.log(`Error: Consent with ID ${consentId} not found in database`);
        return undefined;
      }
      
      console.log(`Consent found with status: ${consent.Status}`);
      
      // Check if consent is in the right state
      if (consent.Status !== ConsentStatus.AUTHORISED) {
        console.log(`Error: Consent has invalid status: ${consent.Status}, expected ${ConsentStatus.AUTHORISED}`);
        return undefined;
      }
      
      const now = new Date();
      const executionDateTime = now;
      const settlementDateTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes later
      const paymentId = `p-${uuidv4().substring(0, 8)}`;
      
      console.log(`Generated payment ID: ${paymentId}`);
      
      try {
        // Insert the payment record
        console.log('Inserting payment record into database...');
        const paymentResult = await client.query(`
          INSERT INTO payments (
            payment_id, consent_id, creation_date_time, status,
            status_update_date_time, expected_execution_date_time, expected_settlement_date_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          paymentId,
          consentId,
          now,
          PaymentStatus.ACCEPTED_SETTLEMENT_IN_PROCESS,
          now,
          executionDateTime,
          settlementDateTime
        ]);
        
        if (paymentResult.rows.length === 0) {
          console.error('Database returned empty result after payment insertion');
          throw new Error('Failed to create payment record');
        }
        
        console.log('Payment record created successfully');
      } catch (dbError) {
        console.error('Database error during payment record creation:', dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }
      
      console.log('Payment consent details:', JSON.stringify(consent, null, 2));
      
      // Create debit transaction for the sender account if debtor account is specified
      if (consent.Initiation.DebtorAccount) {
        console.log(`Found debtor account: ${JSON.stringify(consent.Initiation.DebtorAccount, null, 2)}`);
        
        try {
          // Look up the internal account ID using the account identification
          console.log(`Looking up account with identification: ${consent.Initiation.DebtorAccount.Identification}`);
          const account = await getAccountByIdentification(consent.Initiation.DebtorAccount.Identification);
          
          if (account) {
            console.log(`Found matching account with internal ID: ${account.AccountId}`);
            
            try {
              const transaction = {
                AccountId: account.AccountId,
                Status: TransactionStatus.BOOKED,
                BookingDateTime: now.toISOString(),
                ValueDateTime: now.toISOString(),
                TransactionInformation: `Payment to ${consent.Initiation.CreditorAccount.Name} (${now.toISOString()})`,
                Amount: {
                  Amount: consent.Initiation.InstructedAmount.Amount,
                  Currency: consent.Initiation.InstructedAmount.Currency
                },
                CreditDebitIndicator: CreditDebitIndicator.DEBIT,
                BankTransactionCode: {
                  Code: 'Debit',
                  SubCode: 'DomesticPayment'
                },
                CreditorAccount: {
                  SchemeName: consent.Initiation.CreditorAccount.SchemeName,
                  Identification: consent.Initiation.CreditorAccount.Identification,
                  Name: consent.Initiation.CreditorAccount.Name
                }
              };
              
              console.log('Creating transaction with data:', JSON.stringify(transaction, null, 2));
              
              // Create the transaction directly in the database
              await createTransaction(transaction);
              console.log('Transaction created successfully');
            } catch (transactionError) {
              console.error(`Failed to create transaction for payment ${paymentId}:`, transactionError);
              console.error('Transaction error details:', transactionError instanceof Error ? transactionError.stack : 'Unknown error');
              throw new Error(`Transaction creation failed: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`);
            }
          } else {
            console.warn(`Could not find account with identification ${consent.Initiation.DebtorAccount.Identification}`);
          }
        } catch (accountLookupError) {
          console.error('Error during account lookup:', accountLookupError);
          throw new Error(`Account lookup failed: ${accountLookupError instanceof Error ? accountLookupError.message : 'Unknown error'}`);
        }
      } else {
        console.warn(`No debtor account specified for payment ${paymentId}, skipping transaction creation`);
      }
      
      // In a real implementation, we would initiate the actual payment process here
      // For this mock implementation, we'll simulate the payment completing after a short delay
      setTimeout(async () => {
        try {
          await updatePaymentStatus(paymentId, PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED);
          
          // Update consent status to CONSUMED after payment is completed
          await updatePaymentConsentStatus(consentId, ConsentStatus.CONSUMED);
        } catch (error) {
          console.error(`Failed to update payment status for ${paymentId}:`, error);
        }
      }, 2000);
      
      // Get the full payment details to return within the same transaction
      console.log(`Retrieving created payment with ID: ${paymentId} within the transaction`);
      
      // Use the transaction client to retrieve the payment instead of a separate connection
      const paymentResult = await client.query(`
        SELECT
          p.payment_id, p.consent_id, p.creation_date_time, p.status,
          p.status_update_date_time, p.expected_execution_date_time, p.expected_settlement_date_time,
          pc.instruction_identification, pc.end_to_end_identification,
          pc.instructed_amount_amount, pc.instructed_amount_currency,
          pc.creditor_account_scheme_name, pc.creditor_account_identification, pc.creditor_account_name,
          pc.creditor_account_secondary_identification,
          pc.remittance_information_reference, pc.remittance_information_unstructured
        FROM
          payments p
        JOIN
          payment_consents pc ON p.consent_id = pc.consent_id
        WHERE
          p.payment_id = $1
      `, [paymentId]);
      
      console.log(`Query result: Found ${paymentResult.rows.length} matching payments`);
      
      if (paymentResult.rows.length === 0) {
        console.error(`Failed to retrieve created payment with ID: ${paymentId} within transaction`);
        throw new Error('Failed to retrieve created payment');
      }
      
      const createdPayment = rowToPayment(paymentResult.rows[0]);
      console.log('Payment created and retrieved successfully within transaction');
      
      // Publish event for payment creation
      console.log('Publishing payment created event');
      publishPaymentEvent(EventType.PAYMENT_CREATED, paymentId, {
        paymentId: createdPayment.DomesticPaymentId,
        consentId: createdPayment.ConsentId,
        status: createdPayment.Status,
        amount: createdPayment.Initiation.InstructedAmount.Amount,
        currency: createdPayment.Initiation.InstructedAmount.Currency
      }).catch(error => {
        console.error('Failed to publish payment created event:', error);
      });
      
      return createdPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error type');
      throw error;
    }
  });
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  paymentId: string, 
  status: PaymentStatus
): Promise<DomesticPayment | undefined> => {
  try {
    // Get the current payment to capture the old status
    const currentPayment = await getPaymentById(paymentId);
    
    if (!currentPayment) {
      return undefined;
    }
    
    const oldStatus = currentPayment.Status;
    const now = new Date();
    
    // Update the payment status
    await db.query(
      `UPDATE payments 
       SET status = $1, status_update_date_time = $2 
       WHERE payment_id = $3`,
      [status, now, paymentId]
    );
    
    // Get the updated payment
    const updatedPayment = await getPaymentById(paymentId);
    
    if (!updatedPayment) {
      return undefined;
    }
    
    // Publish event for payment status change
    const eventType = mapPaymentStatusToEventType(status);
    if (eventType) {
      publishPaymentEvent(eventType, paymentId, {
        oldStatus,
        newStatus: status,
        paymentId,
        consentId: updatedPayment.ConsentId,
        amount: updatedPayment.Initiation.InstructedAmount.Amount,
        currency: updatedPayment.Initiation.InstructedAmount.Currency
      }).catch(error => {
        console.error(`Failed to publish payment event for status change to ${status}:`, error);
      });
    }
    
    return updatedPayment;
  } catch (error) {
    console.error(`Error updating payment status for ${paymentId}:`, error);
    throw error;
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (
  paymentId: string
): Promise<{
  PaymentStatus: PaymentStatus;
  PaymentStatusUpdateDateTime: string;
  ExpectedExecutionDateTime?: string;
  ExpectedSettlementDateTime?: string;
} | undefined> => {
  try {
    const payment = await getPaymentById(paymentId);
    
    if (!payment) {
      return undefined;
    }
    
    return {
      PaymentStatus: payment.Status,
      PaymentStatusUpdateDateTime: payment.StatusUpdateDateTime,
      ExpectedExecutionDateTime: payment.ExpectedExecutionDateTime,
      ExpectedSettlementDateTime: payment.ExpectedSettlementDateTime
    };
  } catch (error) {
    console.error(`Error getting payment details for ${paymentId}:`, error);
    throw error;
  }
};