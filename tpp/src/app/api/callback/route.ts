import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { getKeyPair, generateClientAssertion } from '@/lib/server/auth/oidcClient';
import {
  getSession,
  storeTokensInSession,
  generateDpopProof,
  createResponseWithSessionCookie
} from '@/lib/server/auth/session';
import { AUTHORIZATION_SERVER_URL, TOKEN_ENDPOINT } from '@/app/api/config';
import { API_GATEWAY_URLS } from '@/app/api/config';

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
    const dpopProof = await generateDpopProof('POST', TOKEN_ENDPOINT, keyPair);
    
    // Generate client assertion for private_key_jwt authentication
    const clientAssertion = await generateClientAssertion(
      AUTHORIZATION_SERVER_URL
    );
    
    console.log('API Callback - Exchanging code for tokens');
    
    // Get the consent ID from the query parameters
    const consentId = searchParams.get('consentId');
    console.log('API Callback - Consent ID from query parameters:', consentId);
    
    // Use the same redirect URI as the PAR request, including the consent ID if present
    const redirectUri = consentId
      ? `http://localhost:3010/callback?consentId=${consentId}`
      : 'http://localhost:3010/callback';
    console.log('API Callback - Using redirect URI:', redirectUri);
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
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
    
    // Extract the consent ID from the token claims or query params
    const tokenConsentId = tokens.consent_id;
    const scope = tokens.scope || '';
    console.log('API Callback - Token scope:', scope);
    console.log('API Callback - Token consent_id claim:', tokenConsentId);
    console.log('API Callback - Full token claims:', JSON.stringify(tokens, null, 2));
    
    // Use the consent ID from the token if available, otherwise use the one from query params
    const effectiveConsentId = tokenConsentId || consentId;
    
    // If we have a consent ID, update its status
    if (effectiveConsentId) {
      console.log(`API Callback - Using consent ID: ${effectiveConsentId}`);
      
      try {
        // Create a status update endpoint URL
        const statusUpdateUrl = `${API_GATEWAY_URLS.PAYMENT_INITIATION}/domestic-payment-consents/${effectiveConsentId}/status`;
        console.log(`API Callback - Updating consent status at: ${statusUpdateUrl}`);
        
        // Generate DPoP proof for the status update request
        const statusUpdateDpopProof = await generateDpopProof('PUT', statusUpdateUrl, keyPair);
        
        // Send the status update request
        const statusUpdateResponse = await fetch(statusUpdateUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `DPoP ${tokens.access_token}`,
            'DPoP': statusUpdateDpopProof
          },
          body: JSON.stringify({
            status: 'Authorised'
          })
        });
        
        if (!statusUpdateResponse.ok) {
          console.error('API Callback - Failed to update consent status:', {
            status: statusUpdateResponse.status,
            statusText: statusUpdateResponse.statusText
          });
          // Continue with the flow even if status update fails
        } else {
          console.log('API Callback - Consent status updated successfully');
          
          // Parse the response
          const statusUpdateData = await statusUpdateResponse.json();
          console.log('API Callback - Status update response:', statusUpdateData);
          
          // Redirect to payments page with the consent ID
          const response = NextResponse.redirect(new URL(`/payments?consentId=${effectiveConsentId}`, request.url));
          
          // Set the session cookie using our helper function
          const responseWithCookie = createResponseWithSessionCookie(response, sessionId);
          
          console.log(`API Callback - Redirecting to payments page with consent ID: ${consentId}`);
          return responseWithCookie;
        }
      } catch (error) {
        console.error('API Callback - Error updating consent status:', error);
        // Continue with the flow even if status update fails
      }
    }
    
    // Default redirect to accounts page if no consent ID or status update failed
    const response = NextResponse.redirect(new URL('/accounts', request.url));
    
    // Set the session cookie using our helper function
    const responseWithCookie = createResponseWithSessionCookie(response, sessionId);
    
    console.log('API Callback - Redirecting to accounts page with session cookie:', sessionId);
    
    return responseWithCookie;
  } catch (error) {
    console.error('API Callback error:', error);
    return NextResponse.redirect(new URL('/auth-error?error=server_error', request.url));
  }
}