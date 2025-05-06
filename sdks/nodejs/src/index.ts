/**
 * Tyk FAPI 2.0 Node.js SDK
 * 
 * This SDK provides a Node.js client for FAPI 2.0 with DPoP support. It implements
 * the OAuth2 client pattern with a TokenSource that automatically obtains new
 * access tokens when needed and generates DPoP proofs for every request.
 */

export { Client } from './client';
export { TokenSource } from './tokenSource';
export { DPoPHTTPClient, createDPoPHTTPClient } from './httpClient';
export { JWKSServer } from './jwksServer';
export * from './types';
export * from './utils';

export const version = '0.1.0';