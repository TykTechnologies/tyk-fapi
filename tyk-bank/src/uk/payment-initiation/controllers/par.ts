import { Request, Response } from 'express';
import { storePushedAuthRequest, getPushedAuthRequest } from '../data/par';
import { AuthorizationRequestParams } from '../models/par';

/**
 * Handle pushed authorization request (PAR)
 * @param req Express request
 * @param res Express response
 */
export const handlePushedAuthorizationRequest = (req: Request, res: Response) => {
  try {
    // In a real implementation, we would validate client authentication here
    // For demo purposes, we'll skip this step
    
    const params = req.body as AuthorizationRequestParams;
    
    // Validate required parameters
    if (!params.clientId) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'client_id is required'
      });
    }
    
    if (!params.responseType) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'response_type is required'
      });
    }
    
    if (!params.redirectUri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'redirect_uri is required'
      });
    }
    
    // Store the pushed authorization request
    const expiresIn = 300; // 5 minutes (increased from 60 seconds for testing)
    const request = storePushedAuthRequest(params, expiresIn);
    
    // Return the request URI and expiration time
    res.status(201).json({
      request_uri: request.requestUri,
      expires_in: expiresIn
    });
  } catch (error) {
    console.error('Error handling pushed authorization request:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An internal server error occurred'
    });
  }
};

/**
 * Get authorization request by request URI
 * @param req Express request
 * @param res Express response
 */
export const getAuthorizationRequest = (req: Request, res: Response) => {
  try {
    const { requestUri } = req.params;
    
    // Get the pushed authorization request
    const request = getPushedAuthRequest(requestUri);
    
    if (!request) {
      return res.status(404).json({
        error: 'invalid_request_uri',
        error_description: 'The request URI was not found or has expired'
      });
    }
    
    // Return the authorization request parameters
    res.status(200).json(request.parameters);
  } catch (error) {
    console.error('Error getting authorization request:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An internal server error occurred'
    });
  }
};