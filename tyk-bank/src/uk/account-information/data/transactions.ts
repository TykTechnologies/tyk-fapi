import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionStatus } from '../models/transaction';
import { CreditDebitIndicator } from '../models/balance';

/**
 * Mock transactions data
 */
export const transactions: Transaction[] = [
  // Current Account Transactions
  {
    AccountId: '22289',
    TransactionId: 'tx001',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-05T10:43:07+00:00',
    ValueDateTime: '2023-04-05T10:43:07+00:00',
    TransactionInformation: 'Coffee Shop',
    Amount: {
      Amount: '4.50',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    BankTransactionCode: {
      Code: 'Debit',
      SubCode: 'CashWithdrawal'
    },
    MerchantDetails: {
      MerchantName: 'Costa Coffee',
      MerchantCategoryCode: '5814'
    }
  },
  {
    AccountId: '22289',
    TransactionId: 'tx002',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-04T14:22:17+00:00',
    ValueDateTime: '2023-04-04T14:22:17+00:00',
    TransactionInformation: 'Grocery Store',
    Amount: {
      Amount: '27.45',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    BankTransactionCode: {
      Code: 'Debit',
      SubCode: 'POS'
    },
    MerchantDetails: {
      MerchantName: 'Tesco',
      MerchantCategoryCode: '5411'
    }
  },
  {
    AccountId: '22289',
    TransactionId: 'tx003',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-01T00:00:01+00:00',
    ValueDateTime: '2023-04-01T00:00:01+00:00',
    TransactionInformation: 'Salary',
    Amount: {
      Amount: '2500.00',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    BankTransactionCode: {
      Code: 'Credit',
      SubCode: 'DirectDeposit'
    },
    CreditorAgent: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'ABCGB2L',
      Name: 'ABC Corp'
    }
  },
  
  // Savings Account Transactions
  {
    AccountId: '31820',
    TransactionId: 'tx004',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-02T12:00:00+00:00',
    ValueDateTime: '2023-04-02T12:00:00+00:00',
    TransactionInformation: 'Transfer from Current Account',
    Amount: {
      Amount: '500.00',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    BankTransactionCode: {
      Code: 'Credit',
      SubCode: 'Transfer'
    },
    DebtorAccount: {
      SchemeName: 'UK.OBIE.SortCodeAccountNumber',
      Identification: '80200110203345',
      Name: 'Mr Kevin Smith'
    }
  },
  {
    AccountId: '31820',
    TransactionId: 'tx005',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-03-15T12:00:00+00:00',
    ValueDateTime: '2023-03-15T12:00:00+00:00',
    TransactionInformation: 'Interest',
    Amount: {
      Amount: '12.50',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    BankTransactionCode: {
      Code: 'Credit',
      SubCode: 'Interest'
    }
  },
  
  // Credit Card Transactions
  {
    AccountId: '42281',
    TransactionId: 'tx006',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-03T18:12:33+00:00',
    ValueDateTime: '2023-04-03T18:12:33+00:00',
    TransactionInformation: 'Restaurant',
    Amount: {
      Amount: '85.20',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    BankTransactionCode: {
      Code: 'Debit',
      SubCode: 'POS'
    },
    MerchantDetails: {
      MerchantName: 'The Ivy',
      MerchantCategoryCode: '5812'
    }
  },
  {
    AccountId: '42281',
    TransactionId: 'tx007',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-02T09:45:11+00:00',
    ValueDateTime: '2023-04-02T09:45:11+00:00',
    TransactionInformation: 'Online Shopping',
    Amount: {
      Amount: '34.99',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    BankTransactionCode: {
      Code: 'Debit',
      SubCode: 'OnlinePurchase'
    },
    MerchantDetails: {
      MerchantName: 'Amazon',
      MerchantCategoryCode: '5999'
    }
  },
  
  // Business Account Transactions
  {
    AccountId: '73625',
    TransactionId: 'tx008',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-04T15:30:00+00:00',
    ValueDateTime: '2023-04-04T15:30:00+00:00',
    TransactionInformation: 'Client Payment',
    Amount: {
      Amount: '1250.00',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    BankTransactionCode: {
      Code: 'Credit',
      SubCode: 'DirectDeposit'
    },
    CreditorAgent: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'XYZGB2L',
      Name: 'XYZ Ltd'
    }
  },
  {
    AccountId: '73625',
    TransactionId: 'tx009',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-01T09:00:00+00:00',
    ValueDateTime: '2023-04-01T09:00:00+00:00',
    TransactionInformation: 'Office Rent',
    Amount: {
      Amount: '800.00',
      Currency: 'GBP'
    },
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    BankTransactionCode: {
      Code: 'Debit',
      SubCode: 'DirectDebit'
    }
  },
  
  // Euro Account Transactions
  {
    AccountId: '82736',
    TransactionId: 'tx010',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-03T14:15:00+00:00',
    ValueDateTime: '2023-04-03T14:15:00+00:00',
    TransactionInformation: 'Transfer from GBP Account',
    Amount: {
      Amount: '500.00',
      Currency: 'EUR'
    },
    CreditDebitIndicator: CreditDebitIndicator.CREDIT,
    BankTransactionCode: {
      Code: 'Credit',
      SubCode: 'Transfer'
    }
  },
  {
    AccountId: '82736',
    TransactionId: 'tx011',
    Status: TransactionStatus.BOOKED,
    BookingDateTime: '2023-04-02T12:30:00+00:00',
    ValueDateTime: '2023-04-02T12:30:00+00:00',
    TransactionInformation: 'Hotel Booking',
    Amount: {
      Amount: '220.00',
      Currency: 'EUR'
    },
    CreditDebitIndicator: CreditDebitIndicator.DEBIT,
    BankTransactionCode: {
      Code: 'Debit',
      SubCode: 'OnlinePurchase'
    },
    MerchantDetails: {
      MerchantName: 'Hotel Europa',
      MerchantCategoryCode: '7011'
    }
  }
];

/**
 * Get all transactions
 */
export const getAllTransactions = (): Transaction[] => {
  return transactions;
};

/**
 * Get transactions by account ID
 */
export const getTransactionsByAccountId = (accountId: string): Transaction[] => {
  console.log(`[DEBUG] getTransactionsByAccountId called with accountId: ${accountId}`);
  console.log(`[DEBUG] Total transactions before filtering: ${transactions.length}`);
  
  const filteredTransactions = transactions.filter(transaction => transaction.AccountId === accountId);
  
  console.log(`[DEBUG] Filtered transactions: ${filteredTransactions.length}`);
  console.log(`[DEBUG] Filtered transaction IDs: ${filteredTransactions.map(t => t.TransactionId).join(', ')}`);
  
  return filteredTransactions;
};

/**
 * Get transactions by account ID and date range
 */
export const getTransactionsByAccountIdAndDateRange = (
  accountId: string,
  fromDate?: string,
  toDate?: string
): Transaction[] => {
  let filteredTransactions = transactions.filter(transaction => transaction.AccountId === accountId);
  
  if (fromDate) {
    filteredTransactions = filteredTransactions.filter(
      transaction => new Date(transaction.BookingDateTime) >= new Date(fromDate)
    );
  }
  
  if (toDate) {
    filteredTransactions = filteredTransactions.filter(
      transaction => new Date(transaction.BookingDateTime) <= new Date(toDate)
    );
  }
  
  return filteredTransactions;
};

/**
 * Create a new transaction
 */
export const createTransaction = (transaction: Omit<Transaction, 'TransactionId'>): Transaction => {
  console.log(`[DEBUG] createTransaction called with data:`, JSON.stringify(transaction, null, 2));
  
  const newTransaction: Transaction = {
    ...transaction,
    TransactionId: `tx${uuidv4().substring(0, 6)}`
  };
  
  console.log(`[DEBUG] New transaction created with ID: ${newTransaction.TransactionId}`);
  console.log(`[DEBUG] Total transactions before adding: ${transactions.length}`);
  
  transactions.push(newTransaction);
  
  console.log(`[DEBUG] Total transactions after adding: ${transactions.length}`);
  console.log(`[DEBUG] All transaction IDs after adding: ${transactions.map(t => t.TransactionId).join(', ')}`);
  
  return newTransaction;
};