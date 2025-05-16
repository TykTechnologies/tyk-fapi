import { Request, Response } from 'express';
import { Event, EventType } from '../models/subscription';
import { publishEvent } from '../services/kafka-producer';

/**
 * Publish an event to Kafka
 * @param req Express request
 * @param res Express response
 */
export const publishEventController = async (req: Request, res: Response) => {
  try {
    const { eventType, resourceId, resourceType, data } = req.body;
    
    console.log('DEBUG: Event publication request received:', { eventType, resourceId, resourceType });
    console.log('DEBUG: ENABLE_EVENTS setting:', process.env.ENABLE_EVENTS);
    
    if (!eventType || !resourceId || !resourceType) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'eventType, resourceId, and resourceType are required'
      });
    }
    
    // Validate event type
    if (!Object.values(EventType).includes(eventType)) {
      console.log('DEBUG: Invalid event type:', eventType, 'Valid types:', Object.values(EventType));
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
    
    console.log('DEBUG: Attempting to publish event to Kafka:', event.id);
    
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