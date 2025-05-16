import { Request, Response } from 'express';
import { 
  createEventSubscription, 
  getEventSubscriptionById, 
  getAllEventSubscriptions,
  updateEventSubscription,
  deleteEventSubscription
} from '../data/pg-subscriptions';
import { 
  EventSubscriptionRequest, 
  EventType,
  SubscriptionStatus
} from '../models/subscription';
import { Links, Meta } from '../../../common/types/common';

/**
 * Create a new event subscription
 * @param req Express request
 * @param res Express response
 */
export const createEventSubscriptionController = async (req: Request, res: Response) => {
  try {
    const subscriptionRequest = req.body as EventSubscriptionRequest;
    
    // Validate request body
    if (!subscriptionRequest?.Data?.Version) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'Version is required'
      });
    }
    
    // Validate event types if provided
    if (subscriptionRequest.Data.EventTypes) {
      const invalidEventTypes = subscriptionRequest.Data.EventTypes.filter(
        type => !Object.values(EventType).includes(type)
      );
      
      if (invalidEventTypes.length > 0) {
        return res.status(400).json({
          ErrorCode: 'InvalidRequest',
          ErrorMessage: `Invalid event types: ${invalidEventTypes.join(', ')}`
        });
      }
    }
    
    // Create new subscription
    const newSubscription = await createEventSubscription(
      subscriptionRequest.Data.CallbackUrl,
      subscriptionRequest.Data.Version,
      subscriptionRequest.Data.EventTypes
    );
    
    const response = {
      Data: {
        EventSubscriptionId: newSubscription.EventSubscriptionId,
        CallbackUrl: newSubscription.CallbackUrl,
        Version: newSubscription.Version,
        EventTypes: newSubscription.EventTypes
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}/${newSubscription.EventSubscriptionId}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating event subscription:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get all event subscriptions
 * @param req Express request
 * @param res Express response
 */
export const getEventSubscriptionsController = async (req: Request, res: Response) => {
  try {
    const subscriptions = await getAllEventSubscriptions();
    
    const response = {
      Data: {
        EventSubscription: subscriptions.map(subscription => ({
          EventSubscriptionId: subscription.EventSubscriptionId,
          CallbackUrl: subscription.CallbackUrl,
          Version: subscription.Version,
          EventTypes: subscription.EventTypes
        }))
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting event subscriptions:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get event subscription by ID
 * @param req Express request
 * @param res Express response
 */
export const getEventSubscriptionByIdController = async (req: Request, res: Response) => {
  try {
    const { EventSubscriptionId } = req.params;
    const subscription = await getEventSubscriptionById(EventSubscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Event subscription with ID ${EventSubscriptionId} not found`
      });
    }
    
    const response = {
      Data: {
        EventSubscriptionId: subscription.EventSubscriptionId,
        CallbackUrl: subscription.CallbackUrl,
        Version: subscription.Version,
        EventTypes: subscription.EventTypes
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting event subscription by ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Update event subscription
 * @param req Express request
 * @param res Express response
 */
export const updateEventSubscriptionController = async (req: Request, res: Response) => {
  try {
    const { EventSubscriptionId } = req.params;
    const subscriptionRequest = req.body as EventSubscriptionRequest;
    
    // Check if subscription exists
    const existingSubscription = await getEventSubscriptionById(EventSubscriptionId);
    if (!existingSubscription) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Event subscription with ID ${EventSubscriptionId} not found`
      });
    }
    
    // Validate request body
    if (!subscriptionRequest?.Data?.Version) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'Version is required'
      });
    }
    
    // Validate event types if provided
    if (subscriptionRequest.Data.EventTypes) {
      const invalidEventTypes = subscriptionRequest.Data.EventTypes.filter(
        type => !Object.values(EventType).includes(type)
      );
      
      if (invalidEventTypes.length > 0) {
        return res.status(400).json({
          ErrorCode: 'InvalidRequest',
          ErrorMessage: `Invalid event types: ${invalidEventTypes.join(', ')}`
        });
      }
    }
    
    // Update subscription
    const updatedSubscription = await updateEventSubscription(
      EventSubscriptionId,
      subscriptionRequest.Data.CallbackUrl,
      subscriptionRequest.Data.Version,
      subscriptionRequest.Data.EventTypes
    );
    
    if (!updatedSubscription) {
      return res.status(500).json({
        ErrorCode: 'InternalServerError',
        ErrorMessage: 'Failed to update event subscription'
      });
    }
    
    const response = {
      Data: {
        EventSubscriptionId: updatedSubscription.EventSubscriptionId,
        CallbackUrl: updatedSubscription.CallbackUrl,
        Version: updatedSubscription.Version,
        EventTypes: updatedSubscription.EventTypes
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating event subscription:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Delete event subscription
 * @param req Express request
 * @param res Express response
 */
export const deleteEventSubscriptionController = async (req: Request, res: Response) => {
  try {
    const { EventSubscriptionId } = req.params;
    
    // Check if subscription exists
    const existingSubscription = await getEventSubscriptionById(EventSubscriptionId);
    if (!existingSubscription) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Event subscription with ID ${EventSubscriptionId} not found`
      });
    }
    
    // Delete subscription
    const deleted = await deleteEventSubscription(EventSubscriptionId);
    
    if (!deleted) {
      return res.status(500).json({
        ErrorCode: 'InternalServerError',
        ErrorMessage: 'Failed to delete event subscription'
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event subscription:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};