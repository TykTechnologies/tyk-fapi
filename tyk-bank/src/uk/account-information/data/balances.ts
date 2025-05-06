import { Balance, BalanceType, CreditDebitIndicator } from '../models/balance';
import { accounts } from './accounts';

/**
 * Mock balances data
 */
export const balances: Balance[] = [
  // Current Account
  {
    AccountId: '22289',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_AVAILABLE,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '3500.00',
      Currency: 'GBP'
    }
  },
  {
    AccountId: '22289',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_BOOKED,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '3500.00',
      Currency: 'GBP'
    }
  },
  
  // Savings Account
  {
    AccountId: '31820',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_AVAILABLE,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '12500.00',
      Currency: 'GBP'
    }
  },
  {
    AccountId: '31820',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_BOOKED,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '12500.00',
      Currency: 'GBP'
    }
  },
  
  // Credit Card Account
  {
    AccountId: '42281',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_AVAILABLE,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '4250.00',
      Currency: 'GBP'
    }
  },
  {
    AccountId: '42281',
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    Type: BalanceType.CLOSING_BOOKED,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '750.00',
      Currency: 'GBP'
    }
  },
  
  // Business Account
  {
    AccountId: '73625',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_AVAILABLE,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '15750.00',
      Currency: 'GBP'
    }
  },
  {
    AccountId: '73625',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_BOOKED,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '15750.00',
      Currency: 'GBP'
    }
  },
  
  // Euro Account
  {
    AccountId: '82736',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_AVAILABLE,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '2750.00',
      Currency: 'EUR'
    }
  },
  {
    AccountId: '82736',
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    Type: BalanceType.CLOSING_BOOKED,
    DateTime: new Date().toISOString(),
    Amount: {
      Amount: '2750.00',
      Currency: 'EUR'
    }
  }
];

/**
 * Get all balances
 */
export const getAllBalances = (): Balance[] => {
  return balances;
};

/**
 * Get balances by account ID
 */
export const getBalancesByAccountId = (accountId: string): Balance[] => {
  return balances.filter(balance => balance.AccountId === accountId);
};

/**
 * Create a new balance
 */
export const createBalance = (balance: Balance): Balance => {
  balances.push(balance);
  return balance;
};