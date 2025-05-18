import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { getKeyPair, generateClientAssertion } from '@/lib/server/auth/oidcClient';
import { getSession, storeTokensInSession, generateDpopProof } from '@/lib/server/auth/session';

/**
 * Callback endpoint
 * This endpoint handles the authorization code callback from the authorization server
 * It exchanges the authorization code for tokens using DPoP
 */
export async function GET(request: NextRequest) {
  console.log('API Callback endpoint called');
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('API Callback - Query parameters:', { code: code?.substring(0, 10) + '...', state, error });
    
    // Check for errors
    if (error) {
      console.error('API Callback - Authorization server error:', error);
      return NextResponse.redirect(new URL('/auth-error?error=' + error, request.url));
    }
    
    // Check for required parameters
    if (!code || !state) {
      console.error('API Callback - Missing required parameters');
      return NextResponse.redirect(new URL('/auth-error?error=invalid_request', request.url));
    }
    
    // Get session ID from cookie
    const sessionId = request.cookies.get('session_id')?.value;
    console.log('API Callback - Session ID from cookie:', sessionId);
    
    if (!sessionId) {
      console.error('API Callback - No session found');
      return NextResponse.redirect(new URL('/auth-error?error=no_session', request.url));
    }
    
    // Get session data
    const { data: session } = await getSession(sessionId);
    console.log('API Callback - Session data before token exchange:', JSON.stringify(session));
    
    // Verify state
    if (session.state !== state) {
      console.error('API Callback - State mismatch');
      return NextResponse.redirect(new URL('/auth-error?error=invalid_state', request.url));
    }
    
    // Get code verifier from session
    const codeVerifier = session.codeVerifier;
    if (!codeVerifier) {
      console.error('API Callback - No code verifier found');
      return NextResponse.redirect(new URL('/auth-error?error=no_code_verifier', request.url));
    }
    
    // Get key pair for DPoP
    const keyPair = await getKeyPair();
    
    // Generate DPoP proof for token endpoint
    const tokenEndpoint = 'http://localhost:8081/realms/fapi-demo/protocol/openid-connect/token';
    const dpopProof = await generateDpopProof('POST', tokenEndpoint, keyPair);
    
    // Generate client assertion for private_key_jwt authentication
    const clientAssertion = await generateClientAssertion(
      'http://localhost:8081/realms/fapi-demo'
    );
    
    console.log('API Callback - Exchanging code for tokens');
    
    // Use the same redirect URI as the PAR request
    const redirectUri = 'http://localhost:3010/callback';
    console.log('API Callback - Using redirect URI:', redirectUri);
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        client_id: 'tpp',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion
      })
    });
    
    // Check for errors
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { text: errorText };
      }
      console.error('API Callback - Token endpoint error:', errorData);
      return NextResponse.redirect(new URL('/auth-error?error=token_error', request.url));
    }
    
    // Parse token response
    const tokens = await tokenResponse.json();
    console.log('API Callback - Token response received:', { 
      access_token: tokens.access_token ? tokens.access_token.substring(0, 10) + '...' : undefined,
      refresh_token: tokens.refresh_token ? 'present' : 'not present',
      token_type: tokens.token_type
    });
    
    // Store tokens in session
    await storeTokensInSession(sessionId, tokens.access_token, tokens.refresh_token);
    
    // Verify session was updated
    const { data: updatedSession } = await getSession(sessionId);
    console.log('API Callback - Session data after token exchange:', { 
      isAuthenticated: updatedSession.isAuthenticated,
      hasAccessToken: !!updatedSession.accessToken,
      hasRefreshToken: !!updatedSession.refreshToken
    });
    
    // Redirect to accounts page
    const response = NextResponse.redirect(new URL('/accounts', request.url));
    
    // Keep the session cookie
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    console.log('API Callback - Redirecting to accounts page with session cookie:', sessionId);
    
    return response;
  } catch (error) {
    console.error('API Callback error:', error);
    return NextResponse.redirect(new URL('/auth-error?error=server_error', request.url));
  }
}