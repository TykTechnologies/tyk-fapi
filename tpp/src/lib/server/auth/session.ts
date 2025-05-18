import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session data interface
 */
export interface SessionData {
  codeVerifier?: string;
  state?: string;
  accessToken?: string;
  refreshToken?: string;
  isAuthenticated?: boolean;
}

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
 * Get a session by ID
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
  console.log(`Retrieved session ${sessionId}:`, JSON.stringify(sessionData));
  
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
  console.log(`Saving session ${sessionId}:`, JSON.stringify(data));
  global.globalSessions.set(sessionId, data);
  
  // Log all sessions for debugging
  console.log('Current sessions:');
  global.globalSessions.forEach((data, id) => {
    console.log(`- ${id}: isAuthenticated=${data.isAuthenticated}, hasAccessToken=${!!data.accessToken}`);
  });
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  console.log(`Deleting session ${sessionId}`);
  global.globalSessions.delete(sessionId);
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
 * Store tokens in session
 */
export async function storeTokensInSession(
  sessionId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const { data } = await getSession(sessionId);
  data.accessToken = accessToken;
  if (refreshToken) {
    data.refreshToken = refreshToken;
  }
  data.isAuthenticated = true;
  await saveSession(sessionId, data);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(sessionId: string): Promise<boolean> {
  const { data } = await getSession(sessionId);
  return !!data.isAuthenticated;
}

/**
 * Get access token from session
 */
export async function getAccessToken(sessionId: string): Promise<string | undefined> {
  const { data } = await getSession(sessionId);
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