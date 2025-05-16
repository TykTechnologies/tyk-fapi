import { Kafka, Producer } from 'kafkajs';
import { EventType } from '../../event-subscriptions/models/subscription';
import { ConsentStatus } from '../models/consent';
import { PaymentStatus } from '../models/payment';

// Re-export EventType enum for use in other files
export { EventType };

// Check if events are enabled
export const isEventsEnabled = (): boolean => {
  return process.env.ENABLE_EVENTS === 'true';
};

// Kafka topic for payment events
export const PAYMENT_EVENTS_TOPIC = 'payment-events';

// Singleton instance of the Kafka producer
let producer: Producer | null = null;

/**
 * Initialize the Kafka producer
 */
export const initializeKafkaProducer = async (): Promise<Producer | null> => {
  // If events are not enabled, return null
  if (!isEventsEnabled()) {
    console.log('Events are disabled. Skipping Kafka producer initialization.');
    return null;
  }

  if (producer) {
    return producer;
  }

  const brokers = process.env.KAFKA_BROKER ? [process.env.KAFKA_BROKER] : ['localhost:9092'];
  
  const kafka = new Kafka({
    clientId: 'tyk-bank-payment-initiation',
    brokers
  });

  producer = kafka.producer();
  
  try {
    await producer.connect();
    console.log('Kafka producer connected successfully');
    return producer;
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
    // Don't throw error, just return null
    return null;
  }
};

/**
 * Publish a payment consent event
 */
export const publishPaymentConsentEvent = async (
  eventType: EventType,
  consentId: string,
  data: Record<string, any>
): Promise<void> => {
  // If events are not enabled, log and return
  if (!isEventsEnabled()) {
    console.log(`Events are disabled. Skipping payment consent event: ${eventType} for consent ${consentId}`);
    return;
  }

  try {
    console.log(`Publishing payment consent event: ${eventType} for consent ${consentId}`);
    
    // Initialize producer if not already initialized
    if (!producer) {
      await initializeKafkaProducer();
    }
    
    if (!producer) {
      console.warn('Kafka producer not initialized. Skipping event publication.');
      return;
    }
    
    // Create event
    const event = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      resourceId: consentId,
      resourceType: 'payment-consent',
      timestamp: new Date().toISOString(),
      data
    };
    
    // Publish to Kafka
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
    
    console.log(`Successfully published payment consent event: ${eventType} for consent ${consentId}`);
  } catch (error) {
    console.error(`Failed to publish payment consent event: ${eventType} for consent ${consentId}`, error);
    // In a production environment, we would implement retry logic here
  }
};

/**
 * Publish a payment event
 */
export const publishPaymentEvent = async (
  eventType: EventType,
  paymentId: string,
  data: Record<string, any>
): Promise<void> => {
  // If events are not enabled, log and return
  if (!isEventsEnabled()) {
    console.log(`Events are disabled. Skipping payment event: ${eventType} for payment ${paymentId}`);
    return;
  }

  try {
    console.log(`Publishing payment event: ${eventType} for payment ${paymentId}`);
    
    // Initialize producer if not already initialized
    if (!producer) {
      await initializeKafkaProducer();
    }
    
    if (!producer) {
      console.warn('Kafka producer not initialized. Skipping event publication.');
      return;
    }
    
    // Create event
    const event = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      resourceId: paymentId,
      resourceType: 'payment',
      timestamp: new Date().toISOString(),
      data
    };
    
    // Publish to Kafka
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
    
    console.log(`Successfully published payment event: ${eventType} for payment ${paymentId}`);
  } catch (error) {
    console.error(`Failed to publish payment event: ${eventType} for payment ${paymentId}`, error);
    // In a production environment, we would implement retry logic here
  }
};

/**
 * Publish a funds confirmation event
 */
export const publishFundsConfirmationEvent = async (
  consentId: string,
  data: Record<string, any>
): Promise<void> => {
  // If events are not enabled, log and return
  if (!isEventsEnabled()) {
    console.log(`Events are disabled. Skipping funds confirmation event for consent ${consentId}`);
    return;
  }

  try {
    console.log(`Publishing funds confirmation event for consent ${consentId}`);
    
    // Initialize producer if not already initialized
    if (!producer) {
      await initializeKafkaProducer();
    }
    
    if (!producer) {
      console.warn('Kafka producer not initialized. Skipping event publication.');
      return;
    }
    
    // Create event
    const event = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: EventType.FUNDS_CONFIRMATION_COMPLETED,
      resourceId: consentId,
      resourceType: 'funds-confirmation',
      timestamp: new Date().toISOString(),
      data
    };
    
    // Publish to Kafka
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
    
    console.log(`Successfully published funds confirmation event for consent ${consentId}`);
  } catch (error) {
    console.error(`Failed to publish funds confirmation event for consent ${consentId}`, error);
    // In a production environment, we would implement retry logic here
  }
};

/**
 * Map consent status to event type
 */
export const mapConsentStatusToEventType = (status: ConsentStatus): EventType | null => {
  switch (status) {
    case ConsentStatus.AWAITING_AUTHORISATION:
      return EventType.PAYMENT_CONSENT_CREATED;
    case ConsentStatus.AUTHORISED:
      return EventType.PAYMENT_CONSENT_AUTHORISED;
    case ConsentStatus.REJECTED:
      return EventType.PAYMENT_CONSENT_REJECTED;
    default:
      return null;
  }
};

/**
 * Map payment status to event type
 */
export const mapPaymentStatusToEventType = (status: PaymentStatus): EventType | null => {
  switch (status) {
    case PaymentStatus.PENDING:
      return EventType.PAYMENT_CREATED;
    case PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED:
      return EventType.PAYMENT_COMPLETED;
    case PaymentStatus.REJECTED:
      return EventType.PAYMENT_FAILED;
    default:
      return null;
  }
};

/**
 * Disconnect the Kafka producer
 */
export const disconnectKafkaProducer = async (): Promise<void> => {
  if (producer) {
    try {
      await producer.disconnect();
      console.log('Kafka producer disconnected');
      producer = null;
    } catch (error) {
      console.error('Failed to disconnect Kafka producer:', error);
    }
  }
};