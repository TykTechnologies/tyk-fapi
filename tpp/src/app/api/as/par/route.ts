import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { generateDpopProof, generateClientAssertion } from '@/lib/server/auth/oidcClient';
import { getSession, storePkceInSession } from '@/lib/server/auth/session';
import { AUTHORIZATION_SERVER_URL } from '@/app/api/config';

/**
 * Pushed Authorization Request (PAR) endpoint
 * This endpoint creates a pushed authorization request to the authorization server
 * It's a more secure alternative to passing authorization parameters in the URL
 * PAR is required for FAPI 2.0 compliance
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const {
      scope = 'openid profile',
      responseType = 'code',
      clientId = process.env.NEXT_PUBLIC_CLIENT_ID || '',
    } = body;
    
    // Use the API callback endpoint as the redirect URI
    const apiRedirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
    
    // Generate state
    const state = uuidv4();
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Create a new session
    const { sessionId } = await getSession();
    
    // Store PKCE code verifier and state in session
    await storePkceInSession(sessionId, codeVerifier, state);
    
    // Generate DPoP proof for PAR endpoint
    // Using the correct PAR endpoint URL from Keycloak
    const parEndpoint = `${AUTHORIZATION_SERVER_URL}/protocol/openid-connect/ext/par/request`;
    const dpopProof = await generateDpopProof('POST', parEndpoint);
    
    // Generate client assertion for private_key_jwt authentication
    const clientAssertion = await generateClientAssertion(
      AUTHORIZATION_SERVER_URL
    );
    
    console.log('Making PAR request to:', parEndpoint);
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', apiRedirectUri);
    
    // Create PAR request
    const formData = new URLSearchParams({
      client_id: clientId,
      response_type: responseType,
      scope,
      redirect_uri: apiRedirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion
    });
    
    console.log('PAR request body:', formData.toString());
    
    // Make the PAR request
    const parResponse = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof
      },
      body: formData
    });
    
    // Log detailed response for debugging
    console.log('PAR response status:', parResponse.status);
    console.log('PAR response headers:', Object.fromEntries(parResponse.headers.entries()));
    
    // Check for errors
    if (!parResponse.ok) {
      const errorText = await parResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (error) {
        errorData = { text: errorText };
        console.log('Failed to parse PAR error response:', error);
      }
      
      console.error('PAR endpoint error details:', {
        status: parResponse.status,
        statusText: parResponse.statusText,
        error: errorData
      });
      
      // No fallback - PAR is required for FAPI 2.0 compliance
      return NextResponse.json(
        { error: 'Failed to create pushed authorization request' },
        { status: 500 }
      );
    }
    
    // Parse PAR response
    const parData = await parResponse.json();
    console.log('PAR response data:', parData);
    
    // Build authorization URL with request_uri
    const authorizationUrl = new URL(`${AUTHORIZATION_SERVER_URL}/protocol/openid-connect/auth`);
    authorizationUrl.searchParams.append('client_id', clientId);
    authorizationUrl.searchParams.append('request_uri', parData.request_uri);
    
    // Return response with session ID and authorization URL
    const response = NextResponse.json({
      authorizationUrl: authorizationUrl.toString(),
      sessionId
    });
    
    // Set session cookie
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });
    
    return response;
  } catch (error) {
    console.error('PAR error:', error);
    return NextResponse.json(
      { error: 'Failed to create pushed authorization request' },
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