/**
 * Type definitions for the Tyk FAPI SDK.
 */

import { KeyLike } from 'jose';
import { Server } from 'http';
import { AxiosInstance } from 'axios';

/**
 * Options for creating a Client.
 */
export interface ClientOptions {
  /**
   * The client secret (for clients that use a secret).
   */
  clientSecret?: string;
  
  /**
   * The private key to use. If not provided, one will be generated.
   */
  privateKey?: KeyLike;
  
  /**
   * The port to run the JWKS server on.
   */
  jwksServerPort?: number;
  
  /**
   * The realm name.
   */
  realmName?: string;
}

/**
 * Represents an OAuth 2.0 token.
 */
export interface Token {
  /**
   * The access token string.
   */
  accessToken: string;
  
  /**
   * The token type (e.g., "DPoP").
   */
  tokenType: string;
  
  /**
   * The expiration time as a Unix timestamp.
   */
  expiry: number;
}

/**
 * Represents a JSON Web Key.
 */
export interface JWK {
  /**
   * The key type.
   */
  kty: string;
  
  /**
   * The curve name.
   */
  crv: string;
  
  /**
   * The x coordinate.
   */
  x: string;
  
  /**
   * The y coordinate.
   */
  y: string;
  
  /**
   * The key ID.
   */
  kid?: string;
  
  /**
   * The algorithm.
   */
  alg?: string;
  
  /**
   * The key use.
   */
  use?: string;
}

/**
 * Represents a JSON Web Key Set.
 */
export interface JWKS {
  /**
   * The keys in the key set.
   */
  keys: JWK[];
}

/**
 * Represents the OpenID configuration.
 */
export interface OpenIDConfiguration {
  /**
   * The issuer URL.
   */
  issuer: string;
  
  /**
   * The authorization endpoint.
   */
  authorization_endpoint: string;
  
  /**
   * The token endpoint.
   */
  token_endpoint: string;
  
  /**
   * The JWKS URI.
   */
  jwks_uri: string;
  
  /**
   * The supported response types.
   */
  response_types_supported: string[];
  
  /**
   * The supported grant types.
   */
  grant_types_supported: string[];
  
  /**
   * The supported token endpoint auth methods.
   */
  token_endpoint_auth_methods_supported: string[];
  
  /**
   * The supported DPoP signing algorithms.
   */
  dpop_signing_alg_values_supported?: string[];
  
  /**
   * Other properties.
   */
  [key: string]: any;
}

/**
 * Represents a token response.
 */
export interface TokenResponse {
  /**
   * The access token.
   */
  access_token: string;
  
  /**
   * The token type.
   */
  token_type: string;
  
  /**
   * The expiration time in seconds.
   */
  expires_in: number;
  
  /**
   * The refresh token.
   */
  refresh_token?: string;
  
  /**
   * The scope.
   */
  scope?: string;
  
  /**
   * The ID token.
   */
  id_token?: string;
  
  /**
   * Other properties.
   */
  [key: string]: any;
}