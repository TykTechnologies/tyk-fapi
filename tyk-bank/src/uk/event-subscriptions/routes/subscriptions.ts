import { Router } from 'express';
import {
  createEventSubscriptionController,
  getEventSubscriptionsController,
  getEventSubscriptionByIdController,
  updateEventSubscriptionController,
  deleteEventSubscriptionController
} from '../controllers/subscriptions';

const router = Router();

/**
 * @swagger
 * /event-subscriptions:
 *   post:
 *     summary: Create event subscription
 *     description: Creates a new event subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventSubscriptionRequest'
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', createEventSubscriptionController);

/**
 * @swagger
 * /event-subscriptions:
 *   get:
 *     summary: Get event subscriptions
 *     description: Retrieves all event subscriptions
 *     responses:
 *       200:
 *         description: List of event subscriptions
 */
router.get('/', getEventSubscriptionsController);

/**
 * @swagger
 * /event-subscriptions/{EventSubscriptionId}:
 *   get:
 *     summary: Get event subscription
 *     description: Retrieves event subscription details by ID
 *     parameters:
 *       - in: path
 *         name: EventSubscriptionId
 *         required: true
 *         description: ID of the subscription to retrieve
 *     responses:
 *       200:
 *         description: Subscription details
 *       404:
 *         description: Subscription not found
 */
router.get('/:EventSubscriptionId', getEventSubscriptionByIdController);

/**
 * @swagger
 * /event-subscriptions/{EventSubscriptionId}:
 *   put:
 *     summary: Update event subscription
 *     description: Updates an existing event subscription
 *     parameters:
 *       - in: path
 *         name: EventSubscriptionId
 *         required: true
 *         description: ID of the subscription to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       404:
 *         description: Subscription not found
 */
router.put('/:EventSubscriptionId', updateEventSubscriptionController);

/**
 * @swagger
 * /event-subscriptions/{EventSubscriptionId}:
 *   delete:
 *     summary: Delete event subscription
 *     description: Deletes an event subscription
 *     parameters:
 *       - in: path
 *         name: EventSubscriptionId
 *         required: true
 *         description: ID of the subscription to delete
 *     responses:
 *       204:
 *         description: Subscription deleted successfully
 *       404:
 *         description: Subscription not found
 */
router.delete('/:EventSubscriptionId', deleteEventSubscriptionController);

export default router;