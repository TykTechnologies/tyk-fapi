import { Links, Meta, ApiResponse } from '../../../common/types/common';

/**
 * Event types that can be subscribed to
 */
export enum EventType {
  PAYMENT_CONSENT_CREATED = 'payment-consent-created',
  PAYMENT_CONSENT_AUTHORISED = 'payment-consent-authorised',
  PAYMENT_CONSENT_REJECTED = 'payment-consent-rejected',
  PAYMENT_CREATED = 'payment-created',
  PAYMENT_COMPLETED = 'payment-completed',
  PAYMENT_FAILED = 'payment-failed',
  FUNDS_CONFIRMATION_COMPLETED = 'funds-confirmation-completed'
}

/**
 * Event subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  REVOKED = 'Revoked'
}

/**
 * Event subscription model
 */
export interface EventSubscription {
  EventSubscriptionId: string;
  CallbackUrl: string;
  Version: string;
  EventTypes: EventType[];
  Status: SubscriptionStatus;
  CreationDateTime: string;
  StatusUpdateDateTime: string;
}

/**
 * Event subscription request
 */
export interface EventSubscriptionRequest {
  Data: {
    CallbackUrl?: string;
    Version: string;
    EventTypes?: EventType[];
  };
}

/**
 * Event subscription response
 */
export interface EventSubscriptionResponse {
  Data: {
    EventSubscriptionId: string;
    CallbackUrl?: string;
    Version: string;
    EventTypes?: EventType[];
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Event subscriptions response (for GET /event-subscriptions)
 */
export interface EventSubscriptionsResponse {
  Data: {
    EventSubscription: Array<{
      EventSubscriptionId: string;
      CallbackUrl?: string;
      Version: string;
      EventTypes?: EventType[];
    }>;
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Event model
 */
export interface Event {
  id: string;
  type: EventType;
  resourceId: string;
  resourceType: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Event notification model (for sending to TPP)
 */
export interface EventNotification {
  iss: string;
  iat: number;
  jti: string;
  aud: string;
  sub: string;
  txn: string;
  toe: number;
  events: {
    'urn:uk:org:openbanking:events:resource-update': {
      subject: {
        subject_type: string;
        'http://openbanking.org.uk/rid': string;
        'http://openbanking.org.uk/rty': string;
        'http://openbanking.org.uk/rlk': Array<{
          version: string;
          link: string;
        }>;
      };
    };
  };
}