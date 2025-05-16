import { v4 as uuidv4 } from 'uuid';
import db from '../../../common/db/connection';
import { Transaction, TransactionStatus } from '../models/transaction';
import { CreditDebitIndicator } from '../models/balance';

/**
 * Convert database row to Transaction model
 */
const rowToTransaction = (row: any): Transaction => {
  const transaction: Transaction = {
    AccountId: row.account_id,
    TransactionId: row.transaction_id,
    Status: row.status as TransactionStatus,
    BookingDateTime: row.booking_date_time.toISOString(),
    ValueDateTime: row.value_date_time.toISOString(),
    TransactionInformation: row.transaction_information,
    Amount: {
      Amount: row.amount.toString(),
      Currency: row.currency
    },
    CreditDebitIndicator: row.credit_debit_indicator as CreditDebitIndicator,
    BankTransactionCode: {
      Code: row.bank_transaction_code_code,
      SubCode: row.bank_transaction_code_sub_code
    }
  };

  // Add optional merchant details if they exist
  if (row.merchant_name) {
    transaction.MerchantDetails = {
      MerchantName: row.merchant_name,
      MerchantCategoryCode: row.merchant_category_code
    };
  }

  // Add optional creditor agent if it exists
  if (row.creditor_agent_scheme_name) {
    transaction.CreditorAgent = {
      SchemeName: row.creditor_agent_scheme_name,
      Identification: row.creditor_agent_identification,
      Name: row.creditor_agent_name
    };
  }

  // Add optional creditor account if it exists
  if (row.creditor_account_scheme_name) {
    transaction.CreditorAccount = {
      SchemeName: row.creditor_account_scheme_name,
      Identification: row.creditor_account_identification,
      Name: row.creditor_account_name,
      SecondaryIdentification: row.creditor_account_secondary_identification
    };
  }

  // Add optional debtor agent if it exists
  if (row.debtor_agent_scheme_name) {
    transaction.DebtorAgent = {
      SchemeName: row.debtor_agent_scheme_name,
      Identification: row.debtor_agent_identification,
      Name: row.debtor_agent_name
    };
  }

  // Add optional debtor account if it exists
  if (row.debtor_account_scheme_name) {
    transaction.DebtorAccount = {
      SchemeName: row.debtor_account_scheme_name,
      Identification: row.debtor_account_identification,
      Name: row.debtor_account_name,
      SecondaryIdentification: row.debtor_account_secondary_identification
    };
  }

  return transaction;
};

/**
 * Get all transactions
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const result = await db.query('SELECT * FROM transactions');
    return result.rows.map(rowToTransaction);
  } catch (error) {
    console.error('Error getting all transactions:', error);
    throw error;
  }
};

/**
 * Get transactions by account ID
 */
export const getTransactionsByAccountId = async (accountId: string): Promise<Transaction[]> => {
  try {
    console.log(`[DEBUG] getTransactionsByAccountId called with accountId: ${accountId}`);
    
    const result = await db.query(
      'SELECT * FROM transactions WHERE account_id = $1',
      [accountId]
    );
    
    console.log(`[DEBUG] Found ${result.rows.length} transactions for account ${accountId}`);
    
    return result.rows.map(rowToTransaction);
  } catch (error) {
    console.error(`Error getting transactions for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Get transactions by account ID and date range
 */
export const getTransactionsByAccountIdAndDateRange = async (
  accountId: string,
  fromDate?: string,
  toDate?: string
): Promise<Transaction[]> => {
  try {
    let query = 'SELECT * FROM transactions WHERE account_id = $1';
    const params: any[] = [accountId];
    
    if (fromDate) {
      query += ` AND booking_date_time >= $${params.length + 1}`;
      params.push(new Date(fromDate));
    }
    
    if (toDate) {
      query += ` AND booking_date_time <= $${params.length + 1}`;
      params.push(new Date(toDate));
    }
    
    const result = await db.query(query, params);
    return result.rows.map(rowToTransaction);
  } catch (error) {
    console.error(`Error getting transactions for account ${accountId} with date range:`, error);
    throw error;
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (transaction: Omit<Transaction, 'TransactionId'>): Promise<Transaction> => {
  try {
    console.log(`[DEBUG] createTransaction called with data:`, JSON.stringify(transaction, null, 2));
    
    const transactionId = `tx${uuidv4().substring(0, 6)}`;
    
    // Start building the query
    let query = `
      INSERT INTO transactions (
        transaction_id, account_id, status, booking_date_time, value_date_time,
        transaction_information, amount, currency, credit_debit_indicator,
        bank_transaction_code_code, bank_transaction_code_sub_code
    `;
    
    // Add optional fields to the column list
    if (transaction.MerchantDetails) {
      query += `, merchant_name, merchant_category_code`;
    }
    
    if (transaction.CreditorAgent) {
      query += `, creditor_agent_scheme_name, creditor_agent_identification, creditor_agent_name`;
    }
    
    if (transaction.CreditorAccount) {
      query += `, creditor_account_scheme_name, creditor_account_identification, creditor_account_name`;
      if (transaction.CreditorAccount.SecondaryIdentification) {
        query += `, creditor_account_secondary_identification`;
      }
    }
    
    if (transaction.DebtorAgent) {
      query += `, debtor_agent_scheme_name, debtor_agent_identification, debtor_agent_name`;
    }
    
    if (transaction.DebtorAccount) {
      query += `, debtor_account_scheme_name, debtor_account_identification, debtor_account_name`;
      if (transaction.DebtorAccount.SecondaryIdentification) {
        query += `, debtor_account_secondary_identification`;
      }
    }
    
    // Start values section
    query += `) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11`;
    
    // Create params array
    const params: any[] = [
      transactionId,
      transaction.AccountId,
      transaction.Status,
      new Date(transaction.BookingDateTime || new Date()),
      new Date(transaction.ValueDateTime || new Date()),
      transaction.TransactionInformation || '',
      parseFloat(transaction.Amount.Amount),
      transaction.Amount.Currency,
      transaction.CreditDebitIndicator,
      transaction.BankTransactionCode?.Code || '',
      transaction.BankTransactionCode?.SubCode || ''
    ];
    
    // Add optional params
    if (transaction.MerchantDetails) {
      query += `, $${params.length + 1}, $${params.length + 2}`;
      params.push(transaction.MerchantDetails.MerchantName);
      params.push(transaction.MerchantDetails.MerchantCategoryCode);
    }
    
    if (transaction.CreditorAgent) {
      query += `, $${params.length + 1}, $${params.length + 2}, $${params.length + 3}`;
      params.push(transaction.CreditorAgent.SchemeName);
      params.push(transaction.CreditorAgent.Identification);
      params.push(transaction.CreditorAgent.Name);
    }
    
    if (transaction.CreditorAccount) {
      query += `, $${params.length + 1}, $${params.length + 2}, $${params.length + 3}`;
      params.push(transaction.CreditorAccount.SchemeName);
      params.push(transaction.CreditorAccount.Identification);
      params.push(transaction.CreditorAccount.Name);
      
      if (transaction.CreditorAccount.SecondaryIdentification) {
        query += `, $${params.length + 1}`;
        params.push(transaction.CreditorAccount.SecondaryIdentification);
      }
    }
    
    if (transaction.DebtorAgent) {
      query += `, $${params.length + 1}, $${params.length + 2}, $${params.length + 3}`;
      params.push(transaction.DebtorAgent.SchemeName);
      params.push(transaction.DebtorAgent.Identification);
      params.push(transaction.DebtorAgent.Name);
    }
    
    if (transaction.DebtorAccount) {
      query += `, $${params.length + 1}, $${params.length + 2}, $${params.length + 3}`;
      params.push(transaction.DebtorAccount.SchemeName);
      params.push(transaction.DebtorAccount.Identification);
      params.push(transaction.DebtorAccount.Name);
      
      if (transaction.DebtorAccount.SecondaryIdentification) {
        query += `, $${params.length + 1}`;
        params.push(transaction.DebtorAccount.SecondaryIdentification);
      }
    }
    
    // Finish the query
    query += `) RETURNING *`;
    
    console.log(`[DEBUG] Executing query: ${query}`);
    console.log(`[DEBUG] With params:`, params);
    
    const result = await db.query(query, params);
    
    console.log(`[DEBUG] New transaction created with ID: ${result.rows[0].transaction_id}`);
    
    return rowToTransaction(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error type');
    console.error('Transaction data that caused the error:', JSON.stringify(transaction, null, 2));
    throw new Error(`Transaction creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction | undefined> => {
  try {
    const result = await db.query(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [transactionId]
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToTransaction(result.rows[0]);
  } catch (error) {
    console.error(`Error getting transaction by ID ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
  transactionId: string, 
  status: TransactionStatus
): Promise<Transaction | undefined> => {
  try {
    const result = await db.query(
      'UPDATE transactions SET status = $1 WHERE transaction_id = $2 RETURNING *',
      [status, transactionId]
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToTransaction(result.rows[0]);
  } catch (error) {
    console.error(`Error updating transaction status for ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const result = await db.query(
      'DELETE FROM transactions WHERE transaction_id = $1 RETURNING *',
      [transactionId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error deleting transaction ${transactionId}:`, error);
    throw error;
  }
};