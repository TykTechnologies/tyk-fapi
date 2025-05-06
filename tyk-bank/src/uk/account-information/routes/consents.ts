import { Router } from 'express';
import { 
  createAccountAccessConsent, 
  getAccountAccessConsent, 
  deleteAccountAccessConsent 
} from '../controllers/consents';

const router = Router();

/**
 * @swagger
 * /account-access-consents:
 *   post:
 *     summary: Create account access consent
 *     description: Creates a new account access consent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsentRequest'
 *     responses:
 *       201:
 *         description: Consent created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', createAccountAccessConsent);

/**
 * @swagger
 * /account-access-consents/{consentId}:
 *   get:
 *     summary: Get account access consent
 *     description: Retrieves account access consent details by ID
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
router.get('/:consentId', getAccountAccessConsent);

/**
 * @swagger
 * /account-access-consents/{consentId}:
 *   delete:
 *     summary: Delete account access consent
 *     description: Deletes an account access consent by ID
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         description: ID of the consent to delete
 *     responses:
 *       204:
 *         description: Consent deleted successfully
 *       404:
 *         description: Consent not found
 */
router.delete('/:consentId', deleteAccountAccessConsent);

export default router;