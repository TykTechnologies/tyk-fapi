import { Links, Meta, ApiResponse } from '../../../common/types/common';

/**
 * Balance type codes
 */
export enum BalanceType {
  CLOSING_AVAILABLE = 'CLAV', // Closing Available
  CLOSING_BOOKED = 'CLBD',    // Closing Booked
  FORWARD_AVAILABLE = 'FWAV', // Forward Available
  INFORMATION = 'INFO',       // Information
  INTERIM_AVAILABLE = 'ITAV', // Interim Available
  INTERIM_BOOKED = 'ITBD',    // Interim Booked
  OPENING_AVAILABLE = 'OPAV', // Opening Available
  OPENING_BOOKED = 'OPBD',    // Opening Booked
  PREVIOUSLY_CLOSED_BOOKED = 'PRCD', // Previously Closed Booked
  EXPECTED = 'XPCD'           // Expected
}

/**
 * Credit/Debit indicator
 */
export enum CreditDebitIndicator {
  CREDIT = 'Credit',
  DEBIT = 'Debit'
}

/**
 * Amount type
 */
export interface Amount {
  Amount: string;
  Currency: string;
}

/**
 * Balance model
 */
export interface Balance {
  AccountId: string;
  CreditDebitIndicator: CreditDebitIndicator;
  Type: BalanceType;
  DateTime: string;
  Amount: Amount;
}

/**
 * Balance response for a single account
 */
export interface AccountBalancesResponse {
  Data: {
    Balance: Balance[];
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Balance response for all accounts
 */
export interface BalancesResponse {
  Data: {
    Balance: Balance[];
  };
  Links: Links;
  Meta: Meta;
}