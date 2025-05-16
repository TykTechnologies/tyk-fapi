import { v4 as uuidv4 } from 'uuid';
import db from '../../../common/db/connection';
import { 
  Account, 
  AccountCategory, 
  AccountIdentificationType, 
  AccountStatus, 
  AccountTypeCode 
} from '../models/account';

/**
 * Convert database row to Account model
 */
const rowToAccount = (row: any): Account => {
  return {
    AccountId: row.account_id,
    Status: row.status as AccountStatus,
    StatusUpdateDateTime: row.status_update_date_time?.toISOString() || new Date().toISOString(),
    Currency: row.currency,
    AccountType: row.account_type,
    AccountSubType: row.account_sub_type as AccountTypeCode,
    Description: row.description,
    Nickname: row.nickname,
    OpeningDate: row.opening_date?.toISOString(),
    AccountCategory: row.account_type === 'Business' ? AccountCategory.BUSINESS : AccountCategory.PERSONAL,
    SwitchStatus: 'UK.CASS.NotSwitched',
    Account: {
      SchemeName: row.scheme_name as AccountIdentificationType,
      Identification: row.identification,
      Name: row.name,
      SecondaryIdentification: row.secondary_identification
    },
    Servicer: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'TYK12345',
      Name: 'Tyk Bank'
    }
  };
};

/**
 * Get all accounts
 */
export const getAllAccounts = async (): Promise<Account[]> => {
  try {
    const result = await db.query('SELECT * FROM accounts');
    return result.rows.map(rowToAccount);
  } catch (error) {
    console.error('Error getting all accounts:', error);
    throw error;
  }
};

/**
 * Get account by ID
 */
export const getAccountById = async (accountId: string): Promise<Account | undefined> => {
  try {
    const result = await db.query(
      'SELECT * FROM accounts WHERE account_id = $1',
      [accountId]
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToAccount(result.rows[0]);
  } catch (error) {
    console.error(`Error getting account by ID ${accountId}:`, error);
    throw error;
  }
};

/**
 * Get account by identification number
 */
export const getAccountByIdentification = async (identification: string): Promise<Account | undefined> => {
  console.log(`=== Looking up account with identification: ${identification} ===`);
  try {
    console.log('Executing database query to find account...');
    const result = await db.query(
      'SELECT * FROM accounts WHERE identification = $1',
      [identification]
    );
    
    console.log(`Query result: Found ${result.rows.length} matching accounts`);
    
    if (result.rows.length === 0) {
      console.log(`No account found with identification: ${identification}`);
      return undefined;
    }
    
    console.log(`Account found with ID: ${result.rows[0].account_id}`);
    const account = rowToAccount(result.rows[0]);
    console.log('Account details:', JSON.stringify(account, null, 2));
    
    return account;
  } catch (error) {
    console.error(`Error getting account by identification ${identification}:`, error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error type');
    throw error;
  }
};

/**
 * Create a new account
 */
export const createAccount = async (account: Omit<Account, 'AccountId'>): Promise<Account> => {
  try {
    const accountId = uuidv4().substring(0, 5);
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO accounts (
        account_id, currency, account_type, account_sub_type, 
        description, nickname, status, opening_date, 
        scheme_name, identification, name, secondary_identification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        accountId,
        account.Currency,
        account.AccountType,
        account.AccountSubType,
        account.Description,
        account.Nickname,
        account.Status,
        account.OpeningDate ? new Date(account.OpeningDate) : now,
        account.Account.SchemeName,
        account.Account.Identification,
        account.Account.Name,
        account.Account.SecondaryIdentification
      ]
    );
    
    return rowToAccount(result.rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

/**
 * Update an account
 */
export const updateAccount = async (
  accountId: string,
  updates: Partial<Omit<Account, 'AccountId'>>
): Promise<Account | undefined> => {
  try {
    // Get the current account
    const currentAccount = await getAccountById(accountId);
    
    if (!currentAccount) {
      return undefined;
    }
    
    // Build the update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.Currency !== undefined) {
      updateFields.push(`currency = $${paramIndex}`);
      values.push(updates.Currency);
      paramIndex++;
    }
    
    if (updates.AccountType !== undefined) {
      updateFields.push(`account_type = $${paramIndex}`);
      values.push(updates.AccountType);
      paramIndex++;
    }
    
    if (updates.AccountSubType !== undefined) {
      updateFields.push(`account_sub_type = $${paramIndex}`);
      values.push(updates.AccountSubType);
      paramIndex++;
    }
    
    if (updates.Description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(updates.Description);
      paramIndex++;
    }
    
    if (updates.Nickname !== undefined) {
      updateFields.push(`nickname = $${paramIndex}`);
      values.push(updates.Nickname);
      paramIndex++;
    }
    
    if (updates.Status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(updates.Status);
      paramIndex++;
    }
    
    if (updates.OpeningDate !== undefined) {
      updateFields.push(`opening_date = $${paramIndex}`);
      values.push(new Date(updates.OpeningDate));
      paramIndex++;
    }
    
    if (updates.Account?.SchemeName !== undefined) {
      updateFields.push(`scheme_name = $${paramIndex}`);
      values.push(updates.Account.SchemeName);
      paramIndex++;
    }
    
    if (updates.Account?.Identification !== undefined) {
      updateFields.push(`identification = $${paramIndex}`);
      values.push(updates.Account.Identification);
      paramIndex++;
    }
    
    if (updates.Account?.Name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(updates.Account.Name);
      paramIndex++;
    }
    
    if (updates.Account?.SecondaryIdentification !== undefined) {
      updateFields.push(`secondary_identification = $${paramIndex}`);
      values.push(updates.Account.SecondaryIdentification);
      paramIndex++;
    }
    
    // Always update the status_update_date_time
    updateFields.push(`status_update_date_time = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;
    
    // Add the account_id as the last parameter
    values.push(accountId);
    
    // Execute the update query
    const result = await db.query(
      `UPDATE accounts 
       SET ${updateFields.join(', ')} 
       WHERE account_id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToAccount(result.rows[0]);
  } catch (error) {
    console.error(`Error updating account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Delete an account
 */
export const deleteAccount = async (accountId: string): Promise<boolean> => {
  try {
    const result = await db.query(
      'DELETE FROM accounts WHERE account_id = $1 RETURNING *',
      [accountId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error deleting account ${accountId}:`, error);
    throw error;
  }
};