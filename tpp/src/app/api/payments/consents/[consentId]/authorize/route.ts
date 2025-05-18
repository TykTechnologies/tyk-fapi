import { NextRequest, NextResponse } from 'next/server';
import { getSession, generateDpopProof } from '@/lib/server/auth/session';
import { makeAuthenticatedRequest, getKeyPair, generateClientAssertion } from '@/lib/server/auth/oidcClient';

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
    
    // Get the authorization server URL
    const authorizationServerUrl = process.env.AUTHORIZATION_SERVER_URL || 'http://localhost:8081/realms/fapi-demo';
    
    // Generate a state value
    const state = consentId;
    
    // Define the redirect URI
    const redirectUri = `http://localhost:3010/payments?consentId=${consentId}`;
    
    // Generate a client assertion for authorization
    const clientAssertion = await generateClientAssertion(authorizationServerUrl);
    
    // Since PAR is not available, use standard authorization endpoint with DPoP
    // Generate the authorization URL with all parameters
    const authorizationUrl = `${authorizationServerUrl}/protocol/openid-connect/auth?` + 
      new URLSearchParams({
        client_id: 'tpp',
        response_type: 'code',
        scope: 'openid profile payments',
        redirect_uri: redirectUri,
        state,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion
      }).toString();
    
    console.log(`Generated authorization URL: ${authorizationUrl}`);
    
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