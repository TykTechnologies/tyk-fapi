/**
 * Domestic Payment Consent Authorization Route Handler
 *
 * This route handler is responsible for authorizing a domestic payment consent.
 * It sends the authorization request directly to the authorization server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZATION_SERVER_URL } from '../../../config';
import { getApiGatewayHeaders } from '../../../utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { consentId: string } }
) {
  try {
    // Fix for Next.js error: properly handle params
    const {consentId} = await params;
    
    if (!consentId) {
      console.error('Missing consentId parameter');
      return NextResponse.json(
        { error: 'Missing consentId parameter' },
        { status: 400 }
      );
    }
    
    console.log(`Server-side API route: Authorizing payment consent ${consentId} via Authorization Server`);
    
    // Construct the Authorization Server URL
    const authServerUrl = `${AUTHORIZATION_SERVER_URL}/domestic-payment-consents/${consentId}/authorize`;
    console.log(`Making direct request to Authorization Server: ${authServerUrl}`);
    
    // Make the request to the Authorization Server
    const response = await fetch(authServerUrl, {
      method: 'PUT',
      headers: getApiGatewayHeaders(request),
    });
    
    // Handle the response
    if (!response.ok) {
      console.error(`Error authorizing payment consent ${consentId}: ${response.status} ${response.statusText}`);
      
      let errorData;
      try {
        errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        try {
          errorData = await response.text();
        } catch (e2) {
          errorData = 'Unknown error';
        }
      }
      
      return NextResponse.json(
        { 
          error: `Failed to authorize payment consent: ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }
    
    // Return the successful response
    const data = await response.json();
    console.log(`Server-side API route: Successfully authorized payment consent ${consentId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error authorizing payment consent:`, error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'authorization_server_unavailable',
          error_description: 'The Authorization Server is not available. Please ensure it is running.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Unexpected error authorizing payment consent' },
      { status: 500 }
    );
  }
}