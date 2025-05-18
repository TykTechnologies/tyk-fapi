import express from 'express';
import {
  createEventSubscriptionController,
  getEventSubscriptionsController,
  getEventSubscriptionByIdController,
  updateEventSubscriptionController,
  deleteEventSubscriptionController
} from '../controllers/subscriptions';

const router = express.Router();

/**
 * @route POST /event-subscriptions
 * @desc Create a new event subscription
 */
router.post('/', createEventSubscriptionController);

/**
 * @route GET /event-subscriptions
 * @desc Get all event subscriptions
 */
router.get('/', getEventSubscriptionsController);

/**
 * @route GET /event-subscriptions/:EventSubscriptionId
 * @desc Get event subscription by ID
 */
router.get('/:EventSubscriptionId', getEventSubscriptionByIdController);

/**
 * @route PUT /event-subscriptions/:EventSubscriptionId
 * @desc Update event subscription
 */
router.put('/:EventSubscriptionId', updateEventSubscriptionController);

/**
 * @route DELETE /event-subscriptions/:EventSubscriptionId
 * @desc Delete event subscription
 */
router.delete('/:EventSubscriptionId', deleteEventSubscriptionController);

export default router;