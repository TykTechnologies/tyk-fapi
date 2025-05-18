import { NextRequest, NextResponse } from 'next/server';
import { getSession, generateDpopProof, storePkceInSession } from '@/lib/server/auth/session';
import { makeAuthenticatedRequest, getKeyPair, generateClientAssertion } from '@/lib/server/auth/oidcClient';
import { AUTHORIZATION_SERVER_URL, PAR_ENDPOINT, AUTHORIZATION_ENDPOINT } from '@/app/api/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Authorize a payment consent
 * This endpoint updates the consent status to "Authorised"
 */
export async function PUT(
  request: NextRequest,
  context: { params: { consentId: string } }
) {
  try {
    // Get consent ID from URL params
    const consentId = context.params.consentId;
    if (!consentId) {
      return NextResponse.json(
        { error: 'Consent ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Authorizing payment consent with ID: ${consentId}`);
    
    // Get session ID from cookie
    const sessionId = request.cookies.get('session_id')?.value;
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }
    
    // Get session data
    const { data: session } = await getSession(sessionId);
    
    // Check if user is authenticated
    if (!session.isAuthenticated || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the payment initiation API URL
    const paymentInitiationApiUrl = process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation';
    
    // Update the consent status to "Authorised"
    const authorizeUrl = `${paymentInitiationApiUrl}/domestic-payment-consents/${consentId}/authorize`;
    console.log(`Sending authorization request to: ${authorizeUrl}`);
    
    const authorizeResponse = await makeAuthenticatedRequest(
      'PUT',
      authorizeUrl,
      session.accessToken
    );
    
    // Check for errors
    if (!authorizeResponse.ok) {
      const errorText = await authorizeResponse.text();
      console.error('Failed to authorize payment consent:', {
        status: authorizeResponse.status,
        statusText: authorizeResponse.statusText,
        body: errorText
      });
      
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          errorData,
          { status: authorizeResponse.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to authorize payment consent', details: errorText },
          { status: authorizeResponse.status }
        );
      }
    }
    
    // Parse response
    const data = await authorizeResponse.json();
    console.log('Payment consent authorized:', data);
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error authorizing payment consent:', error);
    return NextResponse.json(
      { error: 'Failed to authorize payment consent' },
      { status: 500 }
    );
  }
}

/**
 * Payment Consent Authorization API
 * This endpoint generates an authorization URL for a payment consent
 */
export async function GET(
  request: NextRequest,
  context: { params: { consentId: string } }
) {
  try {
    // Get consent ID from URL params
    const consentId = context.params.consentId;
    if (!consentId) {
      return NextResponse.json(
        { error: 'Consent ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Generating authorization URL for consent ID: ${consentId}`);
    
    // Get session ID from cookie
    const sessionId = request.cookies.get('session_id')?.value;
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }
    
    // Get session data
    const { data: session } = await getSession(sessionId);
    
    // Check if user is authenticated
    if (!session.isAuthenticated || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the payment initiation API URL
    const paymentInitiationApiUrl = process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation';
    
    // Get the consent details
    const consentUrl = `${paymentInitiationApiUrl}/domestic-payment-consents/${consentId}`;
    console.log(`Fetching consent details from: ${consentUrl}`);
    
    const consentResponse = await makeAuthenticatedRequest(
      'GET',
      consentUrl,
      session.accessToken
    );
    
    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      console.error('Failed to fetch consent details:', {
        status: consentResponse.status,
        statusText: consentResponse.statusText,
        body: errorText
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch consent details' },
        { status: consentResponse.status }
      );
    }
    
    const consentData = await consentResponse.json();
    console.log('Consent details:', consentData);
    
    // Check if the consent is already authorized
    if (consentData.Data.Status === 'Authorised') {
      return NextResponse.json({
        message: 'Consent is already authorized',
        consentId,
        status: consentData.Data.Status,
        // Return a URL that will redirect back to the payments page with the consent ID
        authorizationUrl: `/payments?consentId=${consentId}`
      });
    }
    
    // Get the authorization server URL from config
    console.log('Using authorization server URL from config:', AUTHORIZATION_SERVER_URL);
    const authorizationServerUrl = AUTHORIZATION_SERVER_URL;
    
    // Generate a state value
    const state = consentId;
    
    // Define the redirect URI
    const redirectUri = `http://localhost:3010/callback?consentId=${consentId}`;
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store PKCE code verifier and state in session
    await storePkceInSession(sessionId, codeVerifier, state);
    
    // Generate a client assertion for PAR
    const clientAssertion = await generateClientAssertion(authorizationServerUrl);
    
    // Use PAR (Pushed Authorization Request) as required by Keycloak
    // First, make a PAR request to get a request_uri
    console.log(`Making PAR request to: ${PAR_ENDPOINT}`);
    
    // Get key pair for DPoP
    const keyPair = await getKeyPair();
    
    // Generate DPoP proof for PAR endpoint
    const dpopProof = await generateDpopProof('POST', PAR_ENDPOINT, keyPair);
    
    // Create PAR request with consent ID in scope
    const parResponse = await fetch(PAR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof
      },
      body: new URLSearchParams({
        client_id: 'tpp',
        response_type: 'code',
        scope: `openid profile payments payment-consent`, // Include payment-consent scope for this flow
        redirect_uri: redirectUri,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        consent_id: consentId // Add consent ID as a request parameter
      })
    });
    
    // Check for errors
    if (!parResponse.ok) {
      const errorText = await parResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { text: errorText };
      }
      
      console.error('PAR endpoint error details:', {
        status: parResponse.status,
        statusText: parResponse.statusText,
        error: errorData
      });
      
      return NextResponse.json(
        { error: 'Failed to create pushed authorization request' },
        { status: 500 }
      );
    }
    
    // Parse PAR response
    const parData = await parResponse.json();
    console.log('PAR response data:', parData);
    
    // Build authorization URL with request_uri
    const authorizationUrl = `${AUTHORIZATION_ENDPOINT}?` +
      new URLSearchParams({
        client_id: 'tpp',
        request_uri: parData.request_uri
      }).toString();
    
    console.log(`Generated authorization URL with PAR: ${authorizationUrl}`);
    
    // Return the authorization URL
    return NextResponse.json({
      consentId,
      status: consentData.Data.Status,
      authorizationUrl
    });
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
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