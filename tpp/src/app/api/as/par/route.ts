/**
 * Pushed Authorization Request (PAR) Route Handler
 *
 * This route handler is responsible for sending a Pushed Authorization Request (PAR)
 * to the authorization server. It implements a fallback mechanism that tries
 * to use a direct connection to the authorization server first, and if that fails,
 * it falls back to using the API Gateway.
 *
 * The flow works as follows:
 * 1. Parse the request body to get the PAR parameters
 * 2. Try to send the PAR request directly to the authorization server
 * 3. If the direct request succeeds, return the response
 * 4. If the direct request fails, try sending the PAR request through the API Gateway
 * 5. If both attempts fail, return a detailed error response
 *
 * This approach ensures that the system can continue to function even if one of the
 * endpoints is unavailable, providing better reliability and fault tolerance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZATION_SERVER_URL, API_GATEWAY_URLS } from '../../config';
import { getApiGatewayHeaders } from '../../utils';

/**
 * Helper function to try a PAR request to a specific URL
 *
 * @param url The URL to send the PAR request to
 * @param body The PAR request body
 * @param request The original NextRequest object
 * @param source A string indicating the source of the request ('direct' or 'gateway')
 * @returns An object containing the success status, response (if successful), and error (if failed)
 */
async function tryPARRequest(
  url: string,
  body: any,
  request: NextRequest,
  source: 'direct' | 'gateway'
): Promise<{ success: boolean; response?: NextResponse; error?: string }> {
  try {
    console.log(`Trying PAR request to ${source} URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getApiGatewayHeaders(request),
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      console.error(`Error pushing authorization request to ${source}: ${response.status} ${response.statusText}`);
      
      let errorData;
      try {
        errorData = await response.json();
        console.error(`Error details from ${source}:`, errorData);
      } catch (e) {
        try {
          errorData = await response.text();
        } catch (e2) {
          errorData = 'Unknown error';
        }
      }
      
      return {
        success: false,
        error: `${response.status} ${response.statusText}: ${JSON.stringify(errorData)}`,
      };
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully pushed authorization request to ${source}`);
    return {
      success: true,
      response: NextResponse.json(data),
    };
  } catch (error) {
    console.error(`Server-side API route: Error making request to ${source}:`, error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: `Connection error: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: `Unknown error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('Server-side API route: Pushing authorization request to Authorization Server');
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('PAR request parameters:', JSON.stringify(body, null, 2));
    
    // Prepare the URL - direct to authorization server
    const url = `${AUTHORIZATION_SERVER_URL}/as/par`;
    console.log(`Using authorization server URL: ${AUTHORIZATION_SERVER_URL}`);
    console.log(`Making direct request to authorization server: ${url}`);
    
    // Try direct connection to authorization server first
    let directResult = await tryPARRequest(url, body, request, 'direct');
    
    // If direct connection was successful, return the result
    if (directResult.success) {
      return directResult.response;
    }
    
    // If direct connection failed, check if it's a connection error
    if (directResult.error && directResult.error.includes('Connection error')) {
      console.error(`Authorization server is not available: ${directResult.error}`);
      return NextResponse.json(
        {
          error: 'authorization_server_unavailable',
          error_description: 'The authorization server is not available. Please ensure it is running.',
          details: directResult.error
        },
        { status: 503 }
      );
    }
    
    // If it's another type of error, try using the API Gateway
    console.log(`Direct connection to authorization server failed: ${directResult.error}`);
    console.log('Falling back to API Gateway for PAR request');
    
    // Construct the API Gateway URL
    const apiGatewayUrl = `${API_GATEWAY_URLS.PAYMENT_INITIATION}/as/par`;
    console.log(`Trying API Gateway: ${apiGatewayUrl}`);
    
    // Try the API Gateway
    const gatewayResult = await tryPARRequest(apiGatewayUrl, body, request, 'gateway');
    
    // If API Gateway was successful, return the result
    if (gatewayResult.success) {
      return gatewayResult.response;
    }
    
    // If both direct connection and API Gateway failed, return a detailed error
    return NextResponse.json(
      {
        error: 'Both direct connection and API Gateway failed',
        message: 'Unable to push authorization request through either direct connection or API Gateway.',
        directError: directResult.error,
        gatewayError: gatewayResult.error
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Server-side API route: Error parsing request body:', error);
    return Response.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    );
  }
}