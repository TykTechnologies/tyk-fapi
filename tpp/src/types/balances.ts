import { ApiResponse, Links, Meta } from './common';

/**
 * Credit/Debit indicator
 */
export enum CreditDebitIndicator {
  CREDIT = 'Credit',
  DEBIT = 'Debit'
}

/**
 * Balance type
 */
export enum BalanceType {
  CLOSING_AVAILABLE = 'CLAV',
  CLOSING_BOOKED = 'CLBD',
  CLOSING_CLEARED = 'ClosingCleared',
  EXPECTED = 'Expected',
  FORWARD_AVAILABLE = 'ForwardAvailable',
  INFORMATION = 'Information',
  INTERIM_AVAILABLE = 'InterimAvailable',
  INTERIM_BOOKED = 'InterimBooked',
  INTERIM_CLEARED = 'InterimCleared',
  OPENING_AVAILABLE = 'OpeningAvailable',
  OPENING_BOOKED = 'OpeningBooked',
  OPENING_CLEARED = 'OpeningCleared',
  PREVIOUSLY_CLOSED_BOOKED = 'PreviouslyClosedBooked'
}

/**
 * Amount with currency
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
export interface BalanceResponse {
  Data: {
    Balance: Balance[];
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Balances response for all accounts
 */
export interface BalancesResponse {
  Data: {
    Balance: Balance[];
  };
  Links: Links;
  Meta: Meta;
}