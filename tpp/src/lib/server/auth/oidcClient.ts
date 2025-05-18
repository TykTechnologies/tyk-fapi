import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

// Store key pair and nonce
// Use a global variable to ensure the key pair persists across API route executions
declare global {
  var globalKeyPair: jose.GenerateKeyPairResult | null;
  var dpopNonce: string | null;
}

// Initialize global variables if they don't exist
if (typeof global.globalKeyPair === 'undefined') {
  global.globalKeyPair = null;
}

if (typeof global.dpopNonce === 'undefined') {
  global.dpopNonce = null;
}

/**
 * Get or generate a key pair for DPoP
 * This will generate a consistent key pair that persists across API route executions
 */
export async function getKeyPair() {
  if (!global.globalKeyPair) {
    console.log('Generating new key pair');
    global.globalKeyPair = await jose.generateKeyPair('ES256');
    
    // Log the generated key pair's thumbprint for debugging
    const jwk = await jose.exportJWK(global.globalKeyPair.publicKey);
    const thumbprint = await jose.calculateJwkThumbprint(jwk);
    console.log('Generated key thumbprint:', thumbprint);
  }
  return global.globalKeyPair;
}

/**
 * Get the JWKS (JSON Web Key Set) for the current key pair
 */
export async function getJwks() {
  const pair = await getKeyPair();
  const jwk = await jose.exportJWK(pair.publicKey);
  
  // Add required properties
  const kid = await jose.calculateJwkThumbprint(jwk);
  jwk.kid = kid;
  jwk.use = 'sig';
  jwk.alg = 'ES256';
  
  console.log('JWKS endpoint returning key with ID:', jwk.kid);
  
  return { keys: [jwk] };
}

/**
 * Store DPoP nonce received from server
 */
export function storeDpopNonce(nonce: string) {
  global.dpopNonce = nonce;
}

/**
 * Generate a DPoP proof for a specific HTTP method and URL
 */
export async function generateDpopProof(method: string, url: string) {
  const pair = await getKeyPair();
  const jwk = await jose.exportJWK(pair.publicKey);
  
  // Remove private key components
  delete jwk.d;
  delete jwk.dp;
  delete jwk.dq;
  delete jwk.p;
  delete jwk.q;
  delete jwk.qi;
  
  // Add required properties
  const kid = await jose.calculateJwkThumbprint(jwk);
  jwk.kid = kid;
  jwk.use = 'sig';
  jwk.alg = 'ES256';
  
  // Create DPoP proof JWT
  const payload = {
    jti: uuidv4(),
    htm: method,
    htu: url,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration
    ...(global.dpopNonce ? { nonce: global.dpopNonce } : {})
  };
  
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk
  };
  
  return await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .sign(pair.privateKey);
}

/**
 * Generate a client assertion for private_key_jwt authentication
 */
export async function generateClientAssertion(audience: string) {
  const pair = await getKeyPair();
  const jwk = await jose.exportJWK(pair.publicKey);
  const kid = await jose.calculateJwkThumbprint(jwk);
  
  const payload = {
    iss: 'tpp',
    sub: 'tpp',
    aud: audience,
    jti: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration
  };
  
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ 
      alg: 'ES256',
      kid
    })
    .sign(pair.privateKey);
}

/**
 * Generate a code verifier and challenge for PKCE
 */
export function generatePkce() {
  // Generate a random string for the code verifier
  const codeVerifier = base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
  
  // Generate the code challenge using S256 method
  return {
    codeVerifier,
    codeChallenge: generateCodeChallenge(codeVerifier)
  };
}

/**
 * Generate a code challenge from a code verifier using S256 method
 */
async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Base64URL encode a Uint8Array
 */
function base64URLEncode(buffer: Uint8Array) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Make an authenticated request with DPoP
 */
export async function makeAuthenticatedRequest(
  method: string,
  url: string,
  accessToken: string,
  body?: any
) {
  // Generate DPoP proof
  const dpopProof = await generateDpopProof(method, url);
  
  // Make request
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `DPoP ${accessToken}`,
      'DPoP': dpopProof,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  
  // Check for DPoP nonce
  const newNonce = response.headers.get('DPoP-Nonce');
  if (newNonce) {
    storeDpopNonce(newNonce);
  }
  
  return response;
}