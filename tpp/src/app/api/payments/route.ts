import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth/session';
import { makeAuthenticatedRequest } from '@/lib/server/auth/oidcClient';

/**
 * Payments API
 * This endpoint creates a payment with the bank after a consent has been obtained
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
    console.log('Payment request body:', body);
    console.log('Payment request body.Data:', body.Data);
    console.log('Payment request ConsentId:', body.Data?.ConsentId);
    console.log('Payment request Initiation:', body.Data?.Initiation);
    
    // If Initiation is missing, try to fetch the consent data
    if (body.Data && body.Data.ConsentId && !body.Data.Initiation) {
      console.log('Initiation is missing, fetching consent data...');
      
      // Get the payment initiation API URL
      const paymentInitiationApiUrl = process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation';
      const consentUrl = `${paymentInitiationApiUrl}/domestic-payment-consents/${body.Data.ConsentId}`;
      
      try {
        // Fetch the consent data
        const consentResponse = await makeAuthenticatedRequest(
          'GET',
          consentUrl,
          session.accessToken
        );
        
        if (!consentResponse.ok) {
          console.error('Failed to fetch consent data:', {
            status: consentResponse.status,
            statusText: consentResponse.statusText
          });
          return NextResponse.json(
            { error: 'Failed to fetch consent data' },
            { status: 500 }
          );
        }
        
        // Parse the consent data
        const consentData = await consentResponse.json();
        console.log('Fetched consent data:', consentData);
        
        // Add the Initiation field to the request body
        body.Data.Initiation = consentData.Data.Initiation;
        console.log('Updated payment request body:', body);
      } catch (error) {
        console.error('Error fetching consent data:', error);
        return NextResponse.json(
          { error: 'Failed to fetch consent data' },
          { status: 500 }
        );
      }
    }
    
    // Validate request body
    if (!body.Data || !body.Data.ConsentId || !body.Data.Initiation) {
      console.error('Invalid payment request body:', {
        hasData: !!body.Data,
        hasConsentId: !!body.Data?.ConsentId,
        hasInitiation: !!body.Data?.Initiation
      });
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Forward the request to the bank's API
    const paymentInitiationApiUrl = process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation';
    const paymentUrl = `${paymentInitiationApiUrl}/domestic-payments`;
    
    console.log('Forwarding payment request to:', paymentUrl);
    
    const response = await makeAuthenticatedRequest(
      'POST',
      paymentUrl,
      session.accessToken,
      body
    );
    
    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment error:', {
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
          { error: 'Failed to create payment', details: errorText },
          { status: response.status }
        );
      }
    }
    
    // Parse response
    const data = await response.json();
    console.log('Payment created:', data);
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

/**
 * Get all payments
 */
export async function GET(request: NextRequest) {
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
    
    // Forward the request to the bank's API
    const paymentInitiationApiUrl = process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation';
    const paymentsUrl = `${paymentInitiationApiUrl}/domestic-payments`;
    
    console.log('Fetching payments from:', paymentsUrl);
    
    const response = await makeAuthenticatedRequest(
      'GET',
      paymentsUrl,
      session.accessToken
    );
    
    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payments fetch error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: response.status }
      );
    }
    
    // Parse response
    const data = await response.json();
    console.log('Payments fetched:', data);
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}