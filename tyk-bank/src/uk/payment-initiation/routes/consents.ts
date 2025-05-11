import { Router } from 'express';
import {
  createDomesticPaymentConsent,
  getDomesticPaymentConsent,
  getDomesticPaymentConsentFundsConfirmation
} from '../controllers/consents';
import { authorizePaymentConsent } from '../controllers/authorization';

const router = Router();

/**
 * @swagger
 * /domestic-payment-consents:
 *   post:
 *     summary: Create domestic payment consent
 *     description: Creates a new domestic payment consent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DomesticPaymentConsentRequest'
 *     responses:
 *       201:
 *         description: Consent created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', createDomesticPaymentConsent);

/**
 * @swagger
 * /domestic-payment-consents/{consentId}:
 *   get:
 *     summary: Get domestic payment consent
 *     description: Retrieves domestic payment consent details by ID
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         description: ID of the consent to retrieve
 *     responses:
 *       200:
 *         description: Consent details
 *       404:
 *         description: Consent not found
 */
router.get('/:consentId', getDomesticPaymentConsent);

/**
 * @swagger
 * /domestic-payment-consents/{consentId}/funds-confirmation:
 *   get:
 *     summary: Get funds confirmation
 *     description: Checks if funds are available for the payment consent
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         description: ID of the consent to check funds for
 *     responses:
 *       200:
 *         description: Funds confirmation result
 *       404:
 *         description: Consent not found
 */
router.get('/:consentId/funds-confirmation', getDomesticPaymentConsentFundsConfirmation);

/**
 * @swagger
 * /domestic-payment-consents/{consentId}/authorize:
 *   put:
 *     summary: Authorize payment consent
 *     description: Authorizes a payment consent
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         description: ID of the consent to authorize
 *     responses:
 *       200:
 *         description: Consent authorized successfully
 *       404:
 *         description: Consent not found
 */
router.put('/:consentId/authorize', authorizePaymentConsent);

export default router;