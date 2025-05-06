import { Links, Meta, ApiResponse } from '../../../common/types/common';

/**
 * Account identification types
 */
export enum AccountIdentificationType {
  SORTCODEACCOUNTNUMBER = 'UK.OBIE.SortCodeAccountNumber',
  IBAN = 'UK.OBIE.IBAN',
  BBAN = 'UK.OBIE.BBAN',
  PAN = 'UK.OBIE.PAN',
  PAYM = 'UK.OBIE.Paym',
  WALLET = 'UK.OBIE.Wallet'
}

/**
 * Account categories
 */
export enum AccountCategory {
  PERSONAL = 'Personal',
  BUSINESS = 'Business'
}

/**
 * Account status
 */
export enum AccountStatus {
  ENABLED = 'Enabled',
  DISABLED = 'Disabled',
  DELETED = 'Deleted',
  PENDING = 'Pending',
  PROFORMA = 'ProForma'
}

/**
 * Account type codes
 */
export enum AccountTypeCode {
  CACC = 'CACC', // Current Account
  SACC = 'SACC', // Savings Account
  CARD = 'CARD', // Card Account
  LOAN = 'LOAN', // Loan Account
  MORT = 'MORT', // Mortgage Account
  SVGS = 'SVGS', // Savings Account
  TRAN = 'TRAN', // Transaction Account
  NREX = 'NREX', // Non-Resident External Account
  MOMA = 'MOMA', // Money Market Account
  CPAC = 'CPAC', // Cash Payment Account
  SLRY = 'SLRY', // Salary Account
  ODFT = 'ODFT', // Overdraft Account
  MGLD = 'MGLD', // Marginal Lending Account
  NFCA = 'NFCA', // No Fee Cash Account
  OTHR = 'OTHR'  // Other
}

/**
 * Account servicer (bank) identification
 */
export interface Servicer {
  SchemeName: string;
  Identification: string;
  Name?: string;
}

/**
 * Account identification
 */
export interface AccountIdentification {
  SchemeName: AccountIdentificationType;
  Identification: string;
  Name?: string;
  SecondaryIdentification?: string;
}

/**
 * Account model
 */
export interface Account {
  AccountId: string;
  Status?: AccountStatus;
  StatusUpdateDateTime?: string;
  Currency: string;
  AccountType?: string;
  AccountSubType?: AccountTypeCode;
  Description?: string;
  Nickname?: string;
  OpeningDate?: string;
  MaturityDate?: string;
  AccountCategory?: AccountCategory;
  SwitchStatus?: string;
  Account: AccountIdentification;
  Servicer?: Servicer;
}

/**
 * Account response
 */
export interface AccountResponse {
  Data: {
    Account: Account;
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Accounts list response
 */
export interface AccountsResponse {
  Data: {
    Account: Account[];
  };
  Links: Links;
  Meta: Meta;
}