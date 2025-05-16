import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import axios from 'axios';
import { Event, EventType, EventNotification } from '../models/subscription';
import { findActiveSubscriptionsForEventType } from '../data/pg-subscriptions';
import { PAYMENT_EVENTS_TOPIC, isEventsEnabled } from './kafka-producer';

// Singleton instance of the Kafka consumer
let consumer: Consumer | null = null;

/**
 * Initialize the Kafka consumer
 */
export const initializeKafkaConsumer = async (): Promise<Consumer | null> => {
  // If events are not enabled, return null
  if (!isEventsEnabled()) {
    console.log('Events are disabled. Skipping Kafka consumer initialization.');
    return null;
  }

  if (consumer) {
    return consumer;
  }

  const brokers = process.env.KAFKA_BROKER ? [process.env.KAFKA_BROKER] : ['localhost:9092'];
  
  const kafka = new Kafka({
    clientId: 'tyk-bank-consumer',
    brokers
  });

  consumer = kafka.consumer({ groupId: 'tyk-bank-event-service' });
  
  try {
    await consumer.connect();
    console.log('Kafka consumer connected successfully');
    
    await consumer.subscribe({ topic: PAYMENT_EVENTS_TOPIC, fromBeginning: false });
    console.log(`Subscribed to topic: ${PAYMENT_EVENTS_TOPIC}`);
    
    await startConsumer();
    
    return consumer;
  } catch (error) {
    console.error('Failed to connect Kafka consumer:', error);
    // Don't throw error, just return null
    return null;
  }
};

/**
 * Start the Kafka consumer to process messages
 */
export const startConsumer = async (): Promise<void> => {
  // If events are not enabled, return
  if (!isEventsEnabled()) {
    console.log('Events are disabled. Skipping Kafka consumer start.');
    return;
  }

  if (!consumer) {
    console.warn('Kafka consumer not initialized. Cannot start consumer.');
    return;
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        if (!message.value) {
          console.warn('Received message with no value');
          return;
        }

        const event: Event = JSON.parse(message.value.toString());
        console.log(`Received event: ${event.id} (${event.type})`);
        
        await processEvent(event);
      } catch (error) {
        console.error('Error processing Kafka message:', error);
      }
    }
  });

  console.log('Kafka consumer started');
};

/**
 * Process an event and send notifications to subscribers
 */
export const processEvent = async (event: Event): Promise<void> => {
  try {
    // Find active subscriptions for this event type
    const subscriptions = await findActiveSubscriptionsForEventType(event.type);
    
    if (subscriptions.length === 0) {
      console.log(`No active subscriptions found for event type: ${event.type}`);
      return;
    }
    
    console.log(`Found ${subscriptions.length} active subscriptions for event type: ${event.type}`);
    
    // Create event notification
    const notification = createEventNotification(event);
    
    // Send notifications to all subscribers
    const sendPromises = subscriptions.map(subscription => {
      if (!subscription.CallbackUrl) {
        console.warn(`Subscription ${subscription.EventSubscriptionId} has no callback URL`);
        return Promise.resolve();
      }
      
      return sendNotification(subscription.CallbackUrl, notification);
    });
    
    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
};

/**
 * Create an event notification from an event
 */
export const createEventNotification = (event: Event): EventNotification => {
  const now = Math.floor(Date.now() / 1000);
  
  return {
    iss: 'https://tyk-bank.example.com',
    iat: now,
    jti: event.id,
    aud: 'https://tpp.example.com',
    sub: `urn:uk:org:openbanking:${event.resourceType}:${event.resourceId}`,
    txn: `txn-${Date.now()}`,
    toe: now,
    events: {
      'urn:uk:org:openbanking:events:resource-update': {
        subject: {
          subject_type: event.resourceType,
          'http://openbanking.org.uk/rid': event.resourceId,
          'http://openbanking.org.uk/rty': event.resourceType,
          'http://openbanking.org.uk/rlk': [
            {
              version: '1.0',
              link: `https://tyk-bank.example.com/${event.resourceType}s/${event.resourceId}`
            }
          ]
        }
      }
    }
  };
};

/**
 * Send a notification to a callback URL
 */
export const sendNotification = async (callbackUrl: string, notification: EventNotification): Promise<void> => {
  try {
    console.log(`Sending notification to ${callbackUrl}`);
    
    const response = await axios.post(callbackUrl, notification, {
      headers: {
        'Content-Type': 'application/jwt',
        'x-fapi-interaction-id': `tyk-${Date.now()}`,
        'x-fapi-financial-id': 'TYK12345'
      }
    });
    
    console.log(`Notification sent successfully to ${callbackUrl}, status: ${response.status}`);
  } catch (error) {
    console.error(`Failed to send notification to ${callbackUrl}:`, error);
    // In a production environment, we would implement retry logic here
  }
};

/**
 * Disconnect the Kafka consumer
 */
export const disconnectKafkaConsumer = async (): Promise<void> => {
  // If events are not enabled, return
  if (!isEventsEnabled()) {
    return;
  }

  if (consumer) {
    try {
      await consumer.disconnect();
      console.log('Kafka consumer disconnected');
      consumer = null;
    } catch (error) {
      console.error('Failed to disconnect Kafka consumer:', error);
      // Don't throw error, just log it
    }
  }
};