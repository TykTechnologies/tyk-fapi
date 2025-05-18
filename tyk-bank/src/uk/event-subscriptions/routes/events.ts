import express from 'express';
import {
  publishEventController,
  getActiveSubscriptionsForEventTypeController
} from '../controllers/events';

const router = express.Router();

/**
 * @route POST /internal/events/publish
 * @desc Publish an event to Kafka
 */
router.post('/publish', publishEventController);

/**
 * @route GET /internal/events/subscriptions/:eventType
 * @desc Get active subscriptions for an event type
 */
router.get('/subscriptions/:eventType', getActiveSubscriptionsForEventTypeController);

export default router;