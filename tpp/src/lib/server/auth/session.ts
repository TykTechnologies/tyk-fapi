import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Session data interface
 * This data is stored securely on the server and never exposed to the frontend
 */
export interface SessionData {
  codeVerifier?: string;
  state?: string;
  accessToken?: string;
  refreshToken?: string;
  isAuthenticated?: boolean;
  tokenExpiry?: number;
  userId?: string;
}

/**
 * Session cookie options
 */
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60, // 24 hours
};

// Global variable to ensure session persistence across API route executions
// Note: This is still not persistent across server restarts
// In a production environment, you would use a database or Redis
declare global {
  var globalSessions: Map<string, SessionData>;
}

// Initialize the global sessions map if it doesn't exist
if (typeof global.globalSessions === 'undefined') {
  console.log('Initializing global sessions map');
  global.globalSessions = new Map<string, SessionData>();
}

/**
 * Get a session by ID from the request cookies
 * If no session exists, create a new one
 */
export async function getSession(sessionId?: string): Promise<{
  sessionId: string;
  data: SessionData;
}> {
  // If no session ID is provided, create a new session
  if (!sessionId) {
    const newSessionId = uuidv4();
    console.log(`Creating new session: ${newSessionId}`);
    global.globalSessions.set(newSessionId, {});
    return { sessionId: newSessionId, data: {} };
  }
  
  // Get existing session or create a new one if it doesn't exist
  const sessionData = global.globalSessions.get(sessionId) || {};
  
  // Log session data without sensitive information
  console.log(`Retrieved session ${sessionId}:`, {
    isAuthenticated: sessionData.isAuthenticated,
    hasAccessToken: !!sessionData.accessToken,
    hasRefreshToken: !!sessionData.refreshToken,
    state: sessionData.state,
    hasCodeVerifier: !!sessionData.codeVerifier,
    userId: sessionData.userId
  });
  
  // If session doesn't exist, create it
  if (!global.globalSessions.has(sessionId)) {
    console.log(`Session ${sessionId} not found, creating new empty session`);
    global.globalSessions.set(sessionId, sessionData);
  }
  
  return { sessionId, data: sessionData };
}

/**
 * Save session data
 */
export async function saveSession(sessionId: string, data: SessionData): Promise<void> {
  // Log session data without sensitive information
  console.log(`Saving session ${sessionId}:`, {
    isAuthenticated: data.isAuthenticated,
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
    state: data.state,
    hasCodeVerifier: !!data.codeVerifier,
    userId: data.userId
  });
  
  // Save session data
  global.globalSessions.set(sessionId, data);
  
  // Log all sessions for debugging (without sensitive information)
  console.log('Current sessions:');
  global.globalSessions.forEach((sessionData, id) => {
    console.log(`- ${id}: isAuthenticated=${sessionData.isAuthenticated}, hasAccessToken=${!!sessionData.accessToken}`);
  });
}

/**
 * Create a response with session cookie
 */
export function createResponseWithSessionCookie(
  response: NextResponse,
  sessionId: string
): NextResponse {
  response.cookies.set('session_id', sessionId, SESSION_COOKIE_OPTIONS);
  return response;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  console.log(`Deleting session ${sessionId}`);
  global.globalSessions.delete(sessionId);
}

/**
 * Create a response that clears the session cookie
 */
export function createResponseWithClearedSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set('session_id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });
  return response;
}

/**
 * Store PKCE code verifier and state in session
 */
export async function storePkceInSession(
  sessionId: string,
  codeVerifier: string,
  state: string
): Promise<void> {
  const { data } = await getSession(sessionId);
  data.codeVerifier = codeVerifier;
  data.state = state;
  await saveSession(sessionId, data);
}

/**
 * Store tokens in session (server-side only)
 * This function stores tokens securely on the server and never exposes them to the frontend
 */
export async function storeTokensInSession(
  sessionId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const { data } = await getSession(sessionId);
  
  // Store tokens securely on the server
  data.accessToken = accessToken;
  if (refreshToken) {
    data.refreshToken = refreshToken;
  }
  
  // Parse token to get expiry time
  try {
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      if (payload.exp) {
        data.tokenExpiry = payload.exp;
      }
      if (payload.sub) {
        data.userId = payload.sub;
      }
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
  
  data.isAuthenticated = true;
  await saveSession(sessionId, data);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(sessionId: string): Promise<boolean> {
  const { data } = await getSession(sessionId);
  
  // Check if session is authenticated
  if (!data.isAuthenticated) {
    return false;
  }
  
  // Check if token has expired
  if (data.tokenExpiry && data.tokenExpiry < Math.floor(Date.now() / 1000)) {
    console.log(`Session ${sessionId} has expired token`);
    return false;
  }
  
  return true;
}

/**
 * Get access token from session (server-side only)
 * This function should only be called from server-side code
 */
export async function getAccessToken(sessionId: string): Promise<string | undefined> {
  const { data } = await getSession(sessionId);
  
  // Check if token has expired
  if (data.tokenExpiry && data.tokenExpiry < Math.floor(Date.now() / 1000)) {
    console.log(`Token for session ${sessionId} has expired`);
    return undefined;
  }
  
  return data.accessToken;
}

/**
 * Generate a DPoP proof for a specific HTTP method and URL
 */
export async function generateDpopProof(
  method: string,
  url: string,
  keyPair: jose.GenerateKeyPairResult,
  nonce?: string
): Promise<string> {
  const jwk = await jose.exportJWK(keyPair.publicKey);
  
  // Remove private key components
  delete jwk.d;
  delete jwk.dp;
  delete jwk.dq;
  delete jwk.p;
  delete jwk.q;
  delete jwk.qi;
  
  // Create DPoP proof JWT
  const payload = {
    jti: uuidv4(),
    htm: method,
    htu: url,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration
    ...(nonce ? { nonce } : {})
  };
  
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk
  };
  
  return await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .sign(keyPair.privateKey);
}