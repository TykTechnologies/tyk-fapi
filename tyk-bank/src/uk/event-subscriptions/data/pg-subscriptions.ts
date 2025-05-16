import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { EventSubscription, EventType, SubscriptionStatus } from '../models/subscription';

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
 * Convert database row to EventSubscription model
 */
const rowToEventSubscription = (row: any): EventSubscription => {
  return {
    EventSubscriptionId: row.subscription_id,
    CallbackUrl: row.callback_url,
    Version: row.version,
    EventTypes: row.event_types,
    Status: row.status as SubscriptionStatus,
    CreationDateTime: row.creation_date_time.toISOString(),
    StatusUpdateDateTime: row.status_update_date_time.toISOString()
  };
};

/**
 * Get all event subscriptions
 */
export const getAllEventSubscriptions = async (): Promise<EventSubscription[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM event_subscriptions'
    );
    
    return result.rows.map(rowToEventSubscription);
  } catch (error) {
    console.error('Error getting all event subscriptions:', error);
    throw error;
  }
};

/**
 * Get event subscription by ID
 */
export const getEventSubscriptionById = async (subscriptionId: string): Promise<EventSubscription | undefined> => {
  try {
    const result = await pool.query(
      'SELECT * FROM event_subscriptions WHERE subscription_id = $1',
      [subscriptionId]
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToEventSubscription(result.rows[0]);
  } catch (error) {
    console.error(`Error getting event subscription by ID ${subscriptionId}:`, error);
    throw error;
  }
};

/**
 * Create a new event subscription
 */
export const createEventSubscription = async (
  callbackUrl: string | undefined,
  version: string,
  eventTypes: EventType[] | undefined
): Promise<EventSubscription> => {
  try {
    const now = new Date();
    const subscriptionId = `esub-${uuidv4().substring(0, 8)}`;
    
    const result = await pool.query(
      `INSERT INTO event_subscriptions (
        subscription_id, 
        callback_url, 
        version, 
        event_types, 
        status, 
        creation_date_time, 
        status_update_date_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        subscriptionId,
        callbackUrl || '',
        version,
        eventTypes || [],
        SubscriptionStatus.ACTIVE,
        now,
        now
      ]
    );
    
    return rowToEventSubscription(result.rows[0]);
  } catch (error) {
    console.error('Error creating event subscription:', error);
    throw error;
  }
};

/**
 * Update an event subscription
 */
export const updateEventSubscription = async (
  subscriptionId: string,
  callbackUrl?: string,
  version?: string,
  eventTypes?: EventType[],
  status?: SubscriptionStatus
): Promise<EventSubscription | undefined> => {
  try {
    // Get the current subscription
    const currentSubscription = await getEventSubscriptionById(subscriptionId);
    
    if (!currentSubscription) {
      return undefined;
    }
    
    // Build the update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (callbackUrl !== undefined) {
      updates.push(`callback_url = $${paramIndex}`);
      values.push(callbackUrl);
      paramIndex++;
    }
    
    if (version !== undefined) {
      updates.push(`version = $${paramIndex}`);
      values.push(version);
      paramIndex++;
    }
    
    if (eventTypes !== undefined) {
      updates.push(`event_types = $${paramIndex}`);
      values.push(eventTypes);
      paramIndex++;
    }
    
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    // Always update the status_update_date_time
    const now = new Date();
    updates.push(`status_update_date_time = $${paramIndex}`);
    values.push(now);
    paramIndex++;
    
    // Add the subscription_id as the last parameter
    values.push(subscriptionId);
    
    // Execute the update query
    const result = await pool.query(
      `UPDATE event_subscriptions 
       SET ${updates.join(', ')} 
       WHERE subscription_id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    return rowToEventSubscription(result.rows[0]);
  } catch (error) {
    console.error(`Error updating event subscription ${subscriptionId}:`, error);
    throw error;
  }
};

/**
 * Delete an event subscription
 */
export const deleteEventSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const result = await pool.query(
      'DELETE FROM event_subscriptions WHERE subscription_id = $1 RETURNING *',
      [subscriptionId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error deleting event subscription ${subscriptionId}:`, error);
    throw error;
  }
};

/**
 * Find active subscriptions for a specific event type
 */
export const findActiveSubscriptionsForEventType = async (eventType: EventType): Promise<EventSubscription[]> => {
  try {
    const result = await pool.query(
      `SELECT * FROM event_subscriptions 
       WHERE status = $1 AND ($2 = ANY(event_types) OR array_length(event_types, 1) IS NULL)`,
      [SubscriptionStatus.ACTIVE, eventType]
    );
    
    return result.rows.map(rowToEventSubscription);
  } catch (error) {
    console.error(`Error finding active subscriptions for event type ${eventType}:`, error);
    throw error;
  }
};