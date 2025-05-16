import db from '../../../common/db/connection';
import { Balance, BalanceType, CreditDebitIndicator } from '../models/balance';

/**
 * Convert database row to Balance model
 */
const rowToBalance = (row: any): Balance => {
  return {
    AccountId: row.account_id,
    CreditDebitIndicator: row.credit_debit_indicator as CreditDebitIndicator,
    Type: row.balance_type as BalanceType,
    DateTime: row.date_time.toISOString(),
    Amount: {
      Amount: row.amount.toString(),
      Currency: row.currency
    }
  };
};

/**
 * Get all balances
 */
export const getAllBalances = async (): Promise<Balance[]> => {
  try {
    const result = await db.query('SELECT * FROM balances');
    return result.rows.map(rowToBalance);
  } catch (error) {
    console.error('Error getting all balances:', error);
    throw error;
  }
};

/**
 * Get balances by account ID
 */
export const getBalancesByAccountId = async (accountId: string): Promise<Balance[]> => {
  try {
    const result = await db.query(
      'SELECT * FROM balances WHERE account_id = $1',
      [accountId]
    );
    
    return result.rows.map(rowToBalance);
  } catch (error) {
    console.error(`Error getting balances for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Create a new balance
 */
export const createBalance = async (balance: Balance): Promise<Balance> => {
  try {
    const result = await db.query(
      `INSERT INTO balances (
        account_id, balance_type, amount, currency, credit_debit_indicator, date_time
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        balance.AccountId,
        balance.Type,
        parseFloat(balance.Amount.Amount),
        balance.Amount.Currency,
        balance.CreditDebitIndicator,
        new Date(balance.DateTime)
      ]
    );
    
    return rowToBalance(result.rows[0]);
  } catch (error) {
    console.error('Error creating balance:', error);
    throw error;
  }
};

/**
 * Update a balance
 */
export const updateBalance = async (
  accountId: string,
  balanceType: BalanceType,
  amount: string,
  currency: string,
  creditDebitIndicator: CreditDebitIndicator
): Promise<Balance | undefined> => {
  try {
    const now = new Date();
    
    const result = await db.query(
      `UPDATE balances 
       SET amount = $1, date_time = $2, credit_debit_indicator = $3 
       WHERE account_id = $4 AND balance_type = $5 AND currency = $6 
       RETURNING *`,
      [parseFloat(amount), now, creditDebitIndicator, accountId, balanceType, currency]
    );
    
    if (result.rows.length === 0) {
      // Balance doesn't exist, create it
      return await createBalance({
        AccountId: accountId,
        Type: balanceType,
        CreditDebitIndicator: creditDebitIndicator,
        DateTime: now.toISOString(),
        Amount: {
          Amount: amount,
          Currency: currency
        }
      });
    }
    
    return rowToBalance(result.rows[0]);
  } catch (error) {
    console.error(`Error updating balance for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Delete balances for an account
 */
export const deleteBalancesByAccountId = async (accountId: string): Promise<boolean> => {
  try {
    const result = await db.query(
      'DELETE FROM balances WHERE account_id = $1 RETURNING *',
      [accountId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error deleting balances for account ${accountId}:`, error);
    throw error;
  }
};