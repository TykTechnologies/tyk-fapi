import { ApiResponse, Links, Meta } from './common';
import { Amount, CreditDebitIndicator } from './balances';

/**
 * Transaction status
 */
export enum TransactionStatus {
  BOOKED = 'Booked',
  PENDING = 'Pending'
}

/**
 * Bank transaction code structure
 */
export interface BankTransactionCode {
  Code: string;
  SubCode: string;
}

/**
 * Proprietary bank transaction code structure
 */
export interface ProprietaryBankTransactionCode {
  Code: string;
  Issuer: string;
}

/**
 * Agent information (e.g., bank)
 */
export interface Agent {
  SchemeName?: string;
  Identification?: string;
  Name?: string;
}

/**
 * Account identification in a transaction
 */
export interface TransactionAccountIdentification {
  SchemeName?: string;
  Identification?: string;
  Name?: string;
  SecondaryIdentification?: string;
}

/**
 * Merchant details
 */
export interface MerchantDetails {
  MerchantName?: string;
  MerchantCategoryCode?: string;
}

/**
 * Transaction model
 */
export interface OBTransaction {
  AccountId: string;
  TransactionId: string;
  TransactionReference?: string;
  Status: TransactionStatus;
  BookingDateTime: string;
  ValueDateTime?: string;
  TransactionInformation?: string;
  Amount: Amount;
  CreditDebitIndicator: CreditDebitIndicator;
  BankTransactionCode?: BankTransactionCode;
  ProprietaryBankTransactionCode?: ProprietaryBankTransactionCode;
  Balance?: {
    Amount: Amount;
    CreditDebitIndicator: CreditDebitIndicator;
    Type: string;
  };
  MerchantDetails?: MerchantDetails;
  CreditorAgent?: Agent;
  CreditorAccount?: TransactionAccountIdentification;
  DebtorAgent?: Agent;
  DebtorAccount?: TransactionAccountIdentification;
}

/**
 * Transaction response for a single account
 */
export interface TransactionResponse {
  Data: {
    Transaction: OBTransaction[];
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Transactions response for all accounts
 */
export interface TransactionsResponse {
  Data: {
    Transaction: OBTransaction[];
  };
  Links: Links;
  Meta: Meta;
}