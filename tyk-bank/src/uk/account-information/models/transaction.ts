import { Links, Meta, ApiResponse } from '../../../common/types/common';
import { Amount, CreditDebitIndicator } from './balance';

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
 * Transaction reference information
 */
export interface TransactionReference {
  Value: string;
}

/**
 * Address information
 */
export interface PostalAddress {
  AddressType?: string;
  Department?: string;
  SubDepartment?: string;
  StreetName?: string;
  BuildingNumber?: string;
  PostCode?: string;
  TownName?: string;
  CountrySubDivision?: string;
  Country?: string;
  AddressLine?: string[];
}

/**
 * Agent information (e.g., bank)
 */
export interface Agent {
  SchemeName?: string;
  Identification?: string;
  Name?: string;
  PostalAddress?: PostalAddress;
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
 * Transaction model
 */
export interface Transaction {
  AccountId: string;
  TransactionId: string;
  TransactionReference?: string;
  Status: TransactionStatus;
  BookingDateTime: string;
  ValueDateTime?: string;
  TransactionInformation?: string;
  AddressLine?: string;
  Amount: Amount;
  CreditDebitIndicator: CreditDebitIndicator;
  BankTransactionCode?: BankTransactionCode;
  ProprietaryBankTransactionCode?: ProprietaryBankTransactionCode;
  Balance?: {
    Amount: Amount;
    CreditDebitIndicator: CreditDebitIndicator;
    Type: string;
  };
  MerchantDetails?: {
    MerchantName?: string;
    MerchantCategoryCode?: string;
  };
  CreditorAgent?: Agent;
  CreditorAccount?: TransactionAccountIdentification;
  DebtorAgent?: Agent;
  DebtorAccount?: TransactionAccountIdentification;
}

/**
 * Transaction response for a single account
 */
export interface AccountTransactionsResponse {
  Data: {
    Transaction: Transaction[];
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Transaction response for all accounts
 */
export interface TransactionsResponse {
  Data: {
    Transaction: Transaction[];
  };
  Links: Links;
  Meta: Meta;
}