import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth/session';
import { makeAuthenticatedRequest } from '@/lib/server/auth/oidcClient';

/**
 * Payment Consent API
 * This endpoint gets a payment consent by ID
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
    
    console.log(`Fetching payment consent with ID: ${consentId}`);
    
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
    
    // Check for errors
    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      console.error('Failed to fetch consent details:', {
        status: consentResponse.status,
        statusText: consentResponse.statusText,
        body: errorText
      });
      
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          errorData,
          { status: consentResponse.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to fetch consent details', details: errorText },
          { status: consentResponse.status }
        );
      }
    }
    
    // Parse response
    const data = await consentResponse.json();
    console.log('Consent details:', data);
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payment consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment consent' },
      { status: 500 }
    );
  }
}