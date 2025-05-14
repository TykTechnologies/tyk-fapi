import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  DomesticPayment,
  PaymentStatus
} from '../models/payment';
import {
  getPaymentConsentById,
  updatePaymentConsentStatus
} from './consents';
import { ConsentStatus } from '../models/consent';
import { TransactionStatus } from '../../account-information/models/transaction';
import { CreditDebitIndicator } from '../../account-information/models/balance';
import { getAccountByIdentification } from '../../account-information/data/accounts';
import {
  publishPaymentEvent,
  mapPaymentStatusToEventType,
  EventType
} from '../services/event-publisher';

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
  
  // Create debit transaction for the sender account
  console.log('Payment consent:', JSON.stringify(consent, null, 2));
  
  if (consent.Initiation.DebtorAccount) {
    console.log(`Found debtor account: ${JSON.stringify(consent.Initiation.DebtorAccount, null, 2)}`);
    
    // Look up the internal account ID using the account identification
    const account = getAccountByIdentification(consent.Initiation.DebtorAccount.Identification);
    
    if (account) {
      console.log(`Found matching account with internal ID: ${account.AccountId}`);
      
      try {
        const transaction = {
          AccountId: account.AccountId, // Use the internal account ID instead of the identification
          Status: TransactionStatus.BOOKED,
          BookingDateTime: now,
          ValueDateTime: now,
          TransactionInformation: `Payment to ${consent.Initiation.CreditorAccount.Name} (${new Date().toISOString()})`,
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
        
        // Call the account information API to create the transaction
        axios.post('http://localhost:3001/transactions', transaction)
          .then((response: any) => {
            console.log(`Transaction created in account information API for payment ${newPayment.DomesticPaymentId}:`,
              JSON.stringify(response.data, null, 2));
          })
          .catch((error: any) => {
            console.error(`Failed to create transaction in account information API for payment ${newPayment.DomesticPaymentId}:`,
              error.response ? error.response.data : error.message);
          });
      } catch (error) {
        console.error(`Failed to create transaction for payment ${newPayment.DomesticPaymentId}:`, error);
      }
    } else {
      console.warn(`Could not find account with identification ${consent.Initiation.DebtorAccount.Identification}`);
    }
  } else {
    console.warn(`No debtor account specified for payment ${newPayment.DomesticPaymentId}, skipping transaction creation`);
  }
  
  // In a real implementation, we would initiate the actual payment process here
  // For this mock implementation, we'll simulate the payment completing after a short delay
  setTimeout(() => {
    updatePaymentStatus(newPayment.DomesticPaymentId, PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED);
    
    // Update consent status to CONSUMED after payment is completed
    updatePaymentConsentStatus(consentId, ConsentStatus.CONSUMED);
  }, 2000);
  
  // Publish event for payment creation
  publishPaymentEvent(EventType.PAYMENT_CREATED, newPayment.DomesticPaymentId, {
    paymentId: newPayment.DomesticPaymentId,
    consentId: newPayment.ConsentId,
    status: newPayment.Status,
    amount: newPayment.Initiation.InstructedAmount.Amount,
    currency: newPayment.Initiation.InstructedAmount.Currency
  }).catch(error => {
    console.error('Failed to publish payment created event:', error);
  });
  
  return newPayment;
};

/**
 * Update payment status
 */
export const updatePaymentStatus = (paymentId: string, status: PaymentStatus): DomesticPayment | undefined => {
  const payment = getPaymentById(paymentId);
  
  if (payment) {
    const oldStatus = payment.Status;
    payment.Status = status;
    payment.StatusUpdateDateTime = new Date().toISOString();
    
    // Publish event for payment status change
    const eventType = mapPaymentStatusToEventType(status);
    if (eventType) {
      publishPaymentEvent(eventType, paymentId, {
        oldStatus,
        newStatus: status,
        paymentId,
        consentId: payment.ConsentId,
        amount: payment.Initiation.InstructedAmount.Amount,
        currency: payment.Initiation.InstructedAmount.Currency
      }).catch(error => {
        console.error(`Failed to publish payment event for status change to ${status}:`, error);
      });
    }
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