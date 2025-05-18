import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth/session';
import { makeAuthenticatedRequest } from '@/lib/server/auth/oidcClient';

/**
 * Payment Consents API
 * This endpoint creates a payment consent with the bank
 */
export async function POST(request: NextRequest) {
  try {
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
    
    // Get request body
    const body = await request.json();
    console.log('Payment consent request body:', body);
    
    // Validate request body
    if (!body.Data || !body.Data.Initiation) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Forward the request to the bank's API
    const paymentInitiationApiUrl = process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation';
    const consentUrl = `${paymentInitiationApiUrl}/domestic-payment-consents`;
    
    console.log('Forwarding payment consent request to:', consentUrl);
    
    const response = await makeAuthenticatedRequest(
      'POST',
      consentUrl,
      session.accessToken,
      body
    );
    
    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment consent error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          errorData,
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to create payment consent', details: errorText },
          { status: response.status }
        );
      }
    }
    
    // Parse response
    const data = await response.json();
    console.log('Payment consent created:', data);
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment consent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment consent' },
      { status: 500 }
    );
  }
}