import { Router } from 'express';
import { 
  createDomesticPayment, 
  getDomesticPayment,
  getDomesticPaymentDetails
} from '../controllers/payments';

const router = Router();

/**
 * @swagger
 * /domestic-payments:
 *   post:
 *     summary: Create domestic payment
 *     description: Creates a new domestic payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DomesticPaymentRequest'
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', createDomesticPayment);

/**
 * @swagger
 * /domestic-payments/{paymentId}:
 *   get:
 *     summary: Get domestic payment
 *     description: Retrieves domestic payment details by ID
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         description: ID of the payment to retrieve
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId', getDomesticPayment);

/**
 * @swagger
 * /domestic-payments/{paymentId}/payment-details:
 *   get:
 *     summary: Get payment details
 *     description: Retrieves additional payment details by ID
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         description: ID of the payment to retrieve details for
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId/payment-details', getDomesticPaymentDetails);

export default router;