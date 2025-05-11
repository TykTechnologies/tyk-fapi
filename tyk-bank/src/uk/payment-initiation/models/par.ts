import { v4 as uuidv4 } from 'uuid';

/**
 * Pushed Authorization Request (PAR) model
 */
export interface PushedAuthorizationRequest {
  requestUri: string;
  clientId: string;
  responseType: string;
  scope: string;
  redirectUri: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  consentId?: string;
  expiresAt: number;
  parameters: Record<string, any>;
}

/**
 * Pushed Authorization Request (PAR) response
 */
export interface PushedAuthorizationResponse {
  requestUri: string;
  expiresIn: number;
}

/**
 * Authorization request parameters
 */
export interface AuthorizationRequestParams {
  clientId: string;
  responseType: string;
  scope: string;
  redirectUri: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  consentId?: string;
  [key: string]: any;
}

/**
 * Generate a unique request URI for PAR
 */
export const generateRequestUri = (): string => {
  return `urn:ietf:params:oauth:request_uri:${uuidv4()}`;
};