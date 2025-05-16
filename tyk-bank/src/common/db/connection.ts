import { Pool, PoolClient } from 'pg';

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'tyk_bank',
  password: process.env.DB_PASSWORD || 'tyk_bank_password',
  database: process.env.DB_NAME || 'tyk_bank',
});

// Log connection status
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('PostgreSQL connection error:', err);
});

/**
 * Get a client from the connection pool
 */
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

/**
 * Execute a query using the connection pool
 * @param text SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export const query = async (text: string, params: any[] = []): Promise<any> => {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', {
      text,
      params,
      duration,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

/**
 * Execute a transaction with multiple queries
 * @param callback Function that executes queries within the transaction
 * @returns Result of the callback function
 */
export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close the connection pool
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database connection pool closed');
};

export default {
  query,
  getClient,
  transaction,
  closePool
};