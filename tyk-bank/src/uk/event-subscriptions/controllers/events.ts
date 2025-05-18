import { Request, Response } from 'express';
import { Event, EventType } from '../models/subscription';
import { publishEvent } from '../services/kafka-producer';
import { findActiveSubscriptionsForEventType } from '../data/subscriptions';

/**
 * Publish an event to Kafka
 * @param req Express request
 * @param res Express response
 */
export const publishEventController = async (req: Request, res: Response) => {
  try {
    const { eventType, resourceId, resourceType, data } = req.body;
    
    if (!eventType || !resourceId || !resourceType) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'eventType, resourceId, and resourceType are required'
      });
    }
    
    // Validate event type
    if (!Object.values(EventType).includes(eventType)) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: `Invalid event type: ${eventType}`
      });
    }
    
    // Create event
    const event: Event = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      resourceId,
      resourceType,
      timestamp: new Date().toISOString(),
      data: data || {}
    };
    
    // Publish event to Kafka
    await publishEvent(event);
    
    res.status(200).json({
      message: 'Event published successfully',
      eventId: event.id
    });
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get active subscriptions for an event type
 * @param req Express request
 * @param res Express response
 */
export const getActiveSubscriptionsForEventTypeController = async (req: Request, res: Response) => {
  try {
    const { eventType } = req.params;
    
    // Validate event type
    if (!Object.values(EventType).includes(eventType as EventType)) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: `Invalid event type: ${eventType}`
      });
    }
    
    // Get active subscriptions
    const subscriptions = await findActiveSubscriptionsForEventType(eventType as EventType);
    
    res.status(200).json({
      count: subscriptions.length,
      subscriptions: subscriptions.map(subscription => ({
        EventSubscriptionId: subscription.EventSubscriptionId,
        CallbackUrl: subscription.CallbackUrl
      }))
    });
  } catch (error) {
    console.error(`Error getting active subscriptions for event type ${req.params.eventType}:`, error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};