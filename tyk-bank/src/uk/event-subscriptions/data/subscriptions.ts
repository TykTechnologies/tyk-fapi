import { v4 as uuidv4 } from 'uuid';
import { EventSubscription, EventType, SubscriptionStatus } from '../models/subscription';

/**
 * In-memory storage for event subscriptions
 */
export const eventSubscriptions: EventSubscription[] = [];

/**
 * Get all event subscriptions
 */
export const getAllEventSubscriptions = (): EventSubscription[] => {
  return eventSubscriptions;
};

/**
 * Get event subscription by ID
 */
export const getEventSubscriptionById = (subscriptionId: string): EventSubscription | undefined => {
  return eventSubscriptions.find(subscription => subscription.EventSubscriptionId === subscriptionId);
};

/**
 * Create a new event subscription
 */
export const createEventSubscription = (
  callbackUrl: string | undefined,
  version: string,
  eventTypes: EventType[] | undefined
): EventSubscription => {
  const now = new Date().toISOString();
  const newSubscription: EventSubscription = {
    EventSubscriptionId: `esub-${uuidv4().substring(0, 8)}`,
    CallbackUrl: callbackUrl || '',
    Version: version,
    EventTypes: eventTypes || [],
    Status: SubscriptionStatus.ACTIVE,
    CreationDateTime: now,
    StatusUpdateDateTime: now
  };
  
  eventSubscriptions.push(newSubscription);
  return newSubscription;
};

/**
 * Update an event subscription
 */
export const updateEventSubscription = (
  subscriptionId: string,
  callbackUrl?: string,
  version?: string,
  eventTypes?: EventType[],
  status?: SubscriptionStatus
): EventSubscription | undefined => {
  const subscription = getEventSubscriptionById(subscriptionId);
  
  if (subscription) {
    if (callbackUrl !== undefined) {
      subscription.CallbackUrl = callbackUrl;
    }
    
    if (version !== undefined) {
      subscription.Version = version;
    }
    
    if (eventTypes !== undefined) {
      subscription.EventTypes = eventTypes;
    }
    
    if (status !== undefined) {
      subscription.Status = status;
    }
    
    subscription.StatusUpdateDateTime = new Date().toISOString();
  }
  
  return subscription;
};

/**
 * Delete an event subscription
 */
export const deleteEventSubscription = (subscriptionId: string): boolean => {
  const index = eventSubscriptions.findIndex(subscription => subscription.EventSubscriptionId === subscriptionId);
  
  if (index !== -1) {
    eventSubscriptions.splice(index, 1);
    return true;
  }
  
  return false;
};

/**
 * Find active subscriptions for a specific event type
 */
export const findActiveSubscriptionsForEventType = (eventType: EventType): EventSubscription[] => {
  return eventSubscriptions.filter(
    subscription => 
      subscription.Status === SubscriptionStatus.ACTIVE && 
      (subscription.EventTypes.includes(eventType) || subscription.EventTypes.length === 0)
  );
};