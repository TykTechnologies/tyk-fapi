import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as jose from 'jose';
import { getKeyPair } from '@/lib/server/auth/oidcClient';
import { getSession, storePkceInSession } from '@/lib/server/auth/session';
import { AUTHORIZATION_SERVER_URL } from '@/app/api/config';

/**
 * Authorization endpoint
 * This endpoint initiates the authorization flow with the authorization server
 * It generates PKCE code verifier and challenge, and redirects to the authorization server
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const redirectUri = searchParams.get('redirect_uri') || process.env.NEXT_PUBLIC_REDIRECT_URI;
    const scope = searchParams.get('scope') || 'openid profile';
    const responseType = searchParams.get('response_type') || 'code';
    const clientId = searchParams.get('client_id') || process.env.NEXT_PUBLIC_CLIENT_ID;
    
    // Generate state
    const state = uuidv4();
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Create a new session
    const { sessionId } = await getSession();
    
    // Store PKCE code verifier and state in session
    await storePkceInSession(sessionId, codeVerifier, state);
    
    // Build authorization URL
    const authorizationUrl = new URL(`${AUTHORIZATION_SERVER_URL}/protocol/openid-connect/auth`);
    authorizationUrl.searchParams.append('client_id', clientId);
    authorizationUrl.searchParams.append('response_type', responseType);
    authorizationUrl.searchParams.append('scope', scope);
    authorizationUrl.searchParams.append('redirect_uri', redirectUri);
    authorizationUrl.searchParams.append('state', state);
    authorizationUrl.searchParams.append('code_challenge', codeChallenge);
    authorizationUrl.searchParams.append('code_challenge_method', 'S256');
    
    // Set session cookie and redirect to authorization server
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });
    
    return response;
  } catch (error) {
    console.error('Authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authorization' },
      { status: 500 }
    );
  }
}

/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  return base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Generate a code challenge from a code verifier using S256 method
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Base64URL encode a Uint8Array
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}