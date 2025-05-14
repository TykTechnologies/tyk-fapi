import { Router } from 'express';
import { publishEventController } from '../controllers/events';

const router = Router();

/**
 * @swagger
 * /internal/events/publish:
 *   post:
 *     summary: Publish an event to Kafka
 *     description: Internal endpoint to publish an event to Kafka
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - resourceId
 *               - resourceType
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: Type of the event
 *               resourceId:
 *                 type: string
 *                 description: ID of the resource
 *               resourceType:
 *                 type: string
 *                 description: Type of the resource
 *               data:
 *                 type: object
 *                 description: Additional data for the event
 *     responses:
 *       200:
 *         description: Event published successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post('/publish', publishEventController);

export default router;