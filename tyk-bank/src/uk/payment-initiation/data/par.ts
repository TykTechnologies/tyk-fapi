import { 
  PushedAuthorizationRequest, 
  AuthorizationRequestParams,
  generateRequestUri
} from '../models/par';

/**
 * In-memory storage for pushed authorization requests
 */
export const pushedAuthRequests = new Map<string, PushedAuthorizationRequest>();

/**
 * Default expiration time for pushed authorization requests (in seconds)
 */
const DEFAULT_EXPIRATION = 300; // 5 minutes (increased from 60 seconds for testing)

/**
 * Store a pushed authorization request
 * @param params Authorization request parameters
 * @param expiresIn Expiration time in seconds
 * @returns The stored request with request URI
 */
export const storePushedAuthRequest = (
  params: AuthorizationRequestParams,
  expiresIn: number = DEFAULT_EXPIRATION
): PushedAuthorizationRequest => {
  const requestUri = generateRequestUri();
  const now = Date.now();
  
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
    expiresAt: now + (expiresIn * 1000),
    parameters: { ...params }
  };
  
  pushedAuthRequests.set(requestUri, request);
  
  // Set up automatic cleanup after expiration
  setTimeout(() => {
    pushedAuthRequests.delete(requestUri);
  }, expiresIn * 1000);
  
  return request;
};

/**
 * Get a pushed authorization request by request URI
 * @param requestUri The request URI
 * @returns The pushed authorization request or undefined if not found or expired
 */
export const getPushedAuthRequest = (requestUri: string): PushedAuthorizationRequest | undefined => {
  const request = pushedAuthRequests.get(requestUri);
  
  if (!request) {
    return undefined;
  }
  
  // Check if the request has expired
  if (request.expiresAt < Date.now()) {
    pushedAuthRequests.delete(requestUri);
    return undefined;
  }
  
  return request;
};

/**
 * Delete a pushed authorization request
 * @param requestUri The request URI
 * @returns True if the request was deleted, false otherwise
 */
export const deletePushedAuthRequest = (requestUri: string): boolean => {
  return pushedAuthRequests.delete(requestUri);
};

/**
 * Clean up expired pushed authorization requests
 */
export const cleanupExpiredRequests = (): void => {
  const now = Date.now();
  
  for (const [requestUri, request] of pushedAuthRequests.entries()) {
    if (request.expiresAt < now) {
      pushedAuthRequests.delete(requestUri);
    }
  }
};

// Set up periodic cleanup of expired requests (every minute)
setInterval(cleanupExpiredRequests, 60 * 1000);