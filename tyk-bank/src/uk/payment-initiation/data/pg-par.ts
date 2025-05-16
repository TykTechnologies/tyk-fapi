import { 
  PushedAuthorizationRequest, 
  AuthorizationRequestParams,
  generateRequestUri
} from '../models/par';
import db from '../../../common/db/connection';

/**
 * Default expiration time for pushed authorization requests (in seconds)
 */
const DEFAULT_EXPIRATION = 300; // 5 minutes

/**
 * Store a pushed authorization request in the database
 * @param params Authorization request parameters
 * @param expiresIn Expiration time in seconds
 * @returns The stored request with request URI
 */
export const storePushedAuthRequest = async (
  params: AuthorizationRequestParams,
  expiresIn: number = DEFAULT_EXPIRATION
): Promise<PushedAuthorizationRequest> => {
  const requestUri = generateRequestUri();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (expiresIn * 1000));
  
  const request: PushedAuthorizationRequest = {
    requestUri,
    clientId: params.clientId,
    responseType: params.responseType,
    scope: params.scope,
    redirectUri: params.redirectUri,
    state: params.state,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
    consentId: params.consentId,
    expiresAt: expiresAt.getTime(),
    parameters: { ...params }
  };
  
  const query = `
    INSERT INTO pushed_auth_requests (
      request_uri, client_id, response_type, scope, redirect_uri, 
      state, code_challenge, code_challenge_method, consent_id, expires_at, parameters
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const values = [
    requestUri,
    params.clientId,
    params.responseType,
    params.scope || null,
    params.redirectUri,
    params.state || null,
    params.codeChallenge || null,
    params.codeChallengeMethod || null,
    params.consentId || null,
    expiresAt,
    JSON.stringify(params)
  ];
  
  try {
    const result = await db.query(query, values);
    console.log('Stored pushed authorization request in database:', requestUri);
    
    // Set up a job to clean up expired requests
    setTimeout(() => {
      cleanupExpiredRequests().catch(err => {
        console.error('Error cleaning up expired requests:', err);
      });
    }, expiresIn * 1000);
    
    return request;
  } catch (error) {
    console.error('Error storing pushed authorization request:', error);
    throw error;
  }
};

/**
 * Get a pushed authorization request by request URI from the database
 * @param requestUri The request URI
 * @returns The pushed authorization request or undefined if not found or expired
 */
export const getPushedAuthRequest = async (requestUri: string): Promise<PushedAuthorizationRequest | undefined> => {
  const query = `
    SELECT * FROM pushed_auth_requests
    WHERE request_uri = $1 AND expires_at > $2
  `;
  
  const values = [requestUri, new Date()];
  
  try {
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    
    return {
      requestUri: row.request_uri,
      clientId: row.client_id,
      responseType: row.response_type,
      scope: row.scope,
      redirectUri: row.redirect_uri,
      state: row.state,
      codeChallenge: row.code_challenge,
      codeChallengeMethod: row.code_challenge_method,
      consentId: row.consent_id,
      expiresAt: new Date(row.expires_at).getTime(),
      parameters: row.parameters
    };
  } catch (error) {
    console.error('Error getting pushed authorization request:', error);
    throw error;
  }
};

/**
 * Delete a pushed authorization request from the database
 * @param requestUri The request URI
 * @returns True if the request was deleted, false otherwise
 */
export const deletePushedAuthRequest = async (requestUri: string): Promise<boolean> => {
  const query = `
    DELETE FROM pushed_auth_requests
    WHERE request_uri = $1
    RETURNING *
  `;
  
  const values = [requestUri];
  
  try {
    const result = await db.query(query, values);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting pushed authorization request:', error);
    throw error;
  }
};

/**
 * Clean up expired pushed authorization requests from the database
 */
export const cleanupExpiredRequests = async (): Promise<void> => {
  const query = `
    DELETE FROM pushed_auth_requests
    WHERE expires_at < $1
  `;
  
  const values = [new Date()];
  
  try {
    const result = await db.query(query, values);
    if (result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired pushed authorization requests`);
    }
  } catch (error) {
    console.error('Error cleaning up expired pushed authorization requests:', error);
    throw error;
  }
};

// Set up periodic cleanup of expired requests (every minute)
setInterval(() => {
  cleanupExpiredRequests().catch(err => {
    console.error('Error cleaning up expired requests:', err);
  });
}, 60 * 1000);