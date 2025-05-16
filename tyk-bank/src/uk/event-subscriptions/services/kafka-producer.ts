import { Kafka, Producer } from 'kafkajs';
import { Event, EventType } from '../models/subscription';

// Kafka topic for payment events
export const PAYMENT_EVENTS_TOPIC = 'payment-events';

// Check if events are enabled
export const isEventsEnabled = (): boolean => {
  const enabled = process.env.ENABLE_EVENTS === 'true';
  console.log(`DEBUG: isEventsEnabled() called, ENABLE_EVENTS=${process.env.ENABLE_EVENTS}, returning ${enabled}`);
  return enabled;
};

// Singleton instance of the Kafka producer
let producer: Producer | null = null;

/**
 * Initialize the Kafka producer
 */
export const initializeKafkaProducer = async (): Promise<Producer | null> => {
  // If events are not enabled, return null
  if (!isEventsEnabled()) {
    console.log('DEBUG: Events are disabled. Skipping Kafka producer initialization.');
    console.log(`DEBUG: ENABLE_EVENTS=${process.env.ENABLE_EVENTS}`);
    return null;
  }

  console.log('DEBUG: Events are enabled. Initializing Kafka producer...');

  if (producer) {
    console.log('DEBUG: Producer already initialized. Reusing existing producer.');
    return producer;
  }

  const brokers = process.env.KAFKA_BROKER ? [process.env.KAFKA_BROKER] : ['localhost:9092'];
  console.log(`DEBUG: Using Kafka brokers:`, brokers);
  
  const kafka = new Kafka({
    clientId: 'tyk-bank-producer',
    brokers
  });

  producer = kafka.producer();
  
  try {
    console.log('DEBUG: Attempting to connect to Kafka...');
    await producer.connect();
    console.log('DEBUG: Kafka producer connected successfully');
    return producer;
  } catch (error) {
    console.error('DEBUG: Failed to connect Kafka producer:', error);
    // Don't throw error, just return null
    return null;
  }
};

/**
 * Publish an event to Kafka
 */
export const publishEvent = async (event: Event): Promise<void> => {
  // If events are not enabled, log and return
  if (!isEventsEnabled()) {
    console.log(`DEBUG: Events are disabled. Skipping event publication: ${event.id} (${event.type})`);
    console.log(`DEBUG: ENABLE_EVENTS=${process.env.ENABLE_EVENTS}, isEventsEnabled()=${isEventsEnabled()}`);
    return;
  }

  try {
    console.log(`DEBUG: Events are enabled. Attempting to publish: ${event.id} (${event.type})`);
    
    if (!producer) {
      console.log('DEBUG: Producer not initialized. Initializing Kafka producer...');
      await initializeKafkaProducer();
    }

    if (!producer) {
      console.warn('DEBUG: Kafka producer initialization failed. Skipping event publication.');
      return;
    }

    console.log(`DEBUG: Sending event to Kafka topic '${PAYMENT_EVENTS_TOPIC}'`);
    await producer.send({
      topic: PAYMENT_EVENTS_TOPIC,
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event),
          headers: {
            'event-type': event.type
          }
        }
      ]
    });

    console.log(`DEBUG: Event successfully published to Kafka: ${event.id} (${event.type})`);
  } catch (error) {
    console.error('Failed to publish event to Kafka:', error);
    // Don't throw error, just log it
  }
};

/**
 * Disconnect the Kafka producer
 */
export const disconnectKafkaProducer = async (): Promise<void> => {
  // If events are not enabled, return
  if (!isEventsEnabled()) {
    return;
  }

  if (producer) {
    try {
      await producer.disconnect();
      console.log('Kafka producer disconnected');
      producer = null;
    } catch (error) {
      console.error('Failed to disconnect Kafka producer:', error);
      // Don't throw error, just log it
    }
  }
};

/**
 * Helper function to publish a payment consent event
 */
export const publishPaymentConsentEvent = async (
  eventType: EventType,
  consentId: string,
  data: Record<string, any>
): Promise<void> => {
  const event: Event = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: eventType,
    resourceId: consentId,
    resourceType: 'payment-consent',
    timestamp: new Date().toISOString(),
    data
  };

  await publishEvent(event);
};

/**
 * Helper function to publish a payment event
 */
export const publishPaymentEvent = async (
  eventType: EventType,
  paymentId: string,
  data: Record<string, any>
): Promise<void> => {
  const event: Event = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: eventType,
    resourceId: paymentId,
    resourceType: 'payment',
    timestamp: new Date().toISOString(),
    data
  };

  await publishEvent(event);
};

/**
 * Helper function to publish a funds confirmation event
 */
export const publishFundsConfirmationEvent = async (
  consentId: string,
  data: Record<string, any>
): Promise<void> => {
  const event: Event = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: EventType.FUNDS_CONFIRMATION_COMPLETED,
    resourceId: consentId,
    resourceType: 'funds-confirmation',
    timestamp: new Date().toISOString(),
    data
  };

  await publishEvent(event);
};