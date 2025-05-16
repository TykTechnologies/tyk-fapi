import axios from 'axios';
import {
  EventType,
  EventSubscriptionRequest,
  EventSubscriptionResponse,
  EventSubscriptionsResponse
} from '@/types/events';

/**
 * Base URL for the bank's event subscriptions API
 */
const API_URL = process.env.NEXT_PUBLIC_EVENT_API_URL || 'http://localhost:3003';

/**
 * Register an event subscription with the bank
 * 
 * @param callbackUrl The URL where the bank should send event notifications
 * @param eventTypes Array of event types to subscribe to
 * @returns The created subscription
 */
export async function registerEventSubscription(
  callbackUrl: string,
  eventTypes?: EventType[]
): Promise<EventSubscriptionResponse> {
  try {
    const request: EventSubscriptionRequest = {
      Data: {
        CallbackUrl: callbackUrl,
        Version: '1.0',
        EventTypes: eventTypes,
      },
    };

    const response = await axios.post<EventSubscriptionResponse>(
      `${API_URL}/event-subscriptions`,
      request
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error registering event subscription:', error);
    throw new Error(
      `Failed to register event subscription: ${error.response?.data?.ErrorMessage || error.message}`
    );
  }
}

/**
 * Get all event subscriptions
 * 
 * @returns List of event subscriptions
 */
export async function getEventSubscriptions(): Promise<EventSubscriptionsResponse> {
  try {
    const response = await axios.get<EventSubscriptionsResponse>(
      `${API_URL}/event-subscriptions`
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error getting event subscriptions:', error);
    throw new Error(
      `Failed to get event subscriptions: ${error.response?.data?.ErrorMessage || error.message}`
    );
  }
}

/**
 * Get an event subscription by ID
 * 
 * @param subscriptionId The ID of the subscription to get
 * @returns The subscription details
 */
export async function getEventSubscription(subscriptionId: string): Promise<EventSubscriptionResponse> {
  try {
    const response = await axios.get<EventSubscriptionResponse>(
      `${API_URL}/event-subscriptions/${subscriptionId}`
    );
    
    return response.data;
  } catch (error: any) {
    console.error(`Error getting event subscription ${subscriptionId}:`, error);
    throw new Error(
      `Failed to get event subscription: ${error.response?.data?.ErrorMessage || error.message}`
    );
  }
}

/**
 * Update an event subscription
 * 
 * @param subscriptionId The ID of the subscription to update
 * @param callbackUrl The new callback URL
 * @param eventTypes The new event types to subscribe to
 * @returns The updated subscription
 */
export async function updateEventSubscription(
  subscriptionId: string,
  callbackUrl?: string,
  eventTypes?: EventType[]
): Promise<EventSubscriptionResponse> {
  try {
    const request: EventSubscriptionRequest = {
      Data: {
        CallbackUrl: callbackUrl,
        Version: '1.0',
        EventTypes: eventTypes,
      },
    };

    const response = await axios.put<EventSubscriptionResponse>(
      `${API_URL}/event-subscriptions/${subscriptionId}`,
      request
    );
    
    return response.data;
  } catch (error: any) {
    console.error(`Error updating event subscription ${subscriptionId}:`, error);
    throw new Error(
      `Failed to update event subscription: ${error.response?.data?.ErrorMessage || error.message}`
    );
  }
}

/**
 * Delete an event subscription
 * 
 * @param subscriptionId The ID of the subscription to delete
 */
export async function deleteEventSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await axios.delete(
      `${API_URL}/event-subscriptions/${subscriptionId}`
    );
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting event subscription ${subscriptionId}:`, error);
    throw new Error(
      `Failed to delete event subscription: ${error.response?.data?.ErrorMessage || error.message}`
    );
  }
}

/**
 * API client for event subscriptions
 */
const eventsApi = {
  registerEventSubscription,
  getEventSubscriptions,
  getEventSubscription,
  updateEventSubscription,
  deleteEventSubscription
};

export default eventsApi;