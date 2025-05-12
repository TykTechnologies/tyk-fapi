import { NextRequest } from 'next/server';
import { API_GATEWAY_URLS } from '../config';
import { getApiGatewayHeaders, makeApiGatewayRequest } from '../utils';

export async function POST(request: NextRequest) {
  console.log('Server-side API route: Creating payment consent via API Gateway');
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('Payment consent request body:', JSON.stringify(body, null, 2));
    
    // Prepare the URL
    const url = `${API_GATEWAY_URLS.PAYMENT_INITIATION}/domestic-payment-consents`;
    
    // Make the request using our utility function
    return makeApiGatewayRequest(
      url,
      {
        method: 'POST',
        headers: getApiGatewayHeaders(request),
        body: JSON.stringify(body),
      },
      'Error creating payment consent'
    );
  } catch (error) {
    console.error('Server-side API route: Error parsing request body:', error);
    return Response.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    );
  }
}