import { Router } from 'express';
import { 
  handlePushedAuthorizationRequest,
  getAuthorizationRequest
} from '../controllers/par';

const router = Router();

/**
 * @swagger
 * /as/par:
 *   post:
 *     summary: Pushed Authorization Request
 *     description: Creates a new pushed authorization request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *               - response_type
 *               - redirect_uri
 *             properties:
 *               client_id:
 *                 type: string
 *               response_type:
 *                 type: string
 *               scope:
 *                 type: string
 *               redirect_uri:
 *                 type: string
 *               state:
 *                 type: string
 *               code_challenge:
 *                 type: string
 *               code_challenge_method:
 *                 type: string
 *               consent_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pushed authorization request created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', handlePushedAuthorizationRequest);

/**
 * @swagger
 * /as/par/{requestUri}:
 *   get:
 *     summary: Get Authorization Request
 *     description: Retrieves an authorization request by request URI
 *     parameters:
 *       - in: path
 *         name: requestUri
 *         required: true
 *         description: The request URI
 *     responses:
 *       200:
 *         description: Authorization request
 *       404:
 *         description: Request URI not found or expired
 */
router.get('/:requestUri', getAuthorizationRequest);

export default router;