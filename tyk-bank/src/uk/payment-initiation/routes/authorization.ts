import { Router } from 'express';
import { 
  handleAuthorizationRequest,
  authorizePaymentConsent
} from '../controllers/authorization';

const router = Router();

/**
 * @swagger
 * /as/authorize:
 *   get:
 *     summary: Authorization endpoint
 *     description: Handles authorization requests
 *     parameters:
 *       - in: query
 *         name: request_uri
 *         required: true
 *         description: The request URI from PAR
 *     responses:
 *       302:
 *         description: Redirect to client with authorization code
 *       400:
 *         description: Invalid request
 */
router.get('/authorize', handleAuthorizationRequest);

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
router.put('/domestic-payment-consents/:consentId/authorize', authorizePaymentConsent);

export default router;