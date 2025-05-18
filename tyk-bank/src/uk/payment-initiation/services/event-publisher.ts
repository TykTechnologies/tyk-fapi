import axios from 'axios';
import { EventType } from '../../event-subscriptions/models/subscription';
import { ConsentStatus } from '../models/consent';
import { PaymentStatus } from '../models/payment';

// Re-export EventType enum for use in other files
export { EventType };

// Check if events are enabled
export const isEventsEnabled = (): boolean => {
  return process.env.ENABLE_EVENTS === 'true';
};

// URL for the event service
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:3003';

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
    
    // In a production environment, we would directly use the Kafka producer
    // For simplicity in this mock, we'll use HTTP to communicate with the event service
    await axios.post(`${EVENT_SERVICE_URL}/internal/events/publish`, {
      eventType,
      resourceId: consentId,
      resourceType: 'payment-consent',
      data
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
    
    // In a production environment, we would directly use the Kafka producer
    // For simplicity in this mock, we'll use HTTP to communicate with the event service
    await axios.post(`${EVENT_SERVICE_URL}/internal/events/publish`, {
      eventType,
      resourceId: paymentId,
      resourceType: 'payment',
      data
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
    
    // In a production environment, we would directly use the Kafka producer
    // For simplicity in this mock, we'll use HTTP to communicate with the event service
    await axios.post(`${EVENT_SERVICE_URL}/internal/events/publish`, {
      eventType: EventType.FUNDS_CONFIRMATION_COMPLETED,
      resourceId: consentId,
      resourceType: 'funds-confirmation',
      data
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
    case PaymentStatus.ACCEPTED_SETTLEMENT_IN_PROCESS:
      return EventType.PAYMENT_PROCESSING;
    case PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED:
      return EventType.PAYMENT_COMPLETED;
    case PaymentStatus.REJECTED:
      return EventType.PAYMENT_FAILED;
    default:
      return null;
  }
};