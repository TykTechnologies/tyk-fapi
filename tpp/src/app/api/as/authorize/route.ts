/**
 * Authorization Route Handler
 *
 * This route handler is responsible for redirecting the user to the authorization server
 * for the OAuth 2.0 authorization flow. It implements a fallback mechanism that tries
 * to use a direct connection to the authorization server first, and if that fails,
 * it falls back to using the API Gateway.
 *
 * The flow works as follows:
 * 1. Extract the request_uri parameter from the query string
 * 2. Construct a URL to the authorization server with all query parameters
 * 3. Try to check if the authorization server is accessible with a HEAD request
 * 4. If the authorization server is accessible, redirect the user to it
 * 5. If the authorization server is not accessible, try the API Gateway instead
 * 6. If both fail, return a detailed error response
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZATION_SERVER_URL, API_GATEWAY_URLS } from '../../config';
import { getApiGatewayHeaders } from '../../utils';

export async function GET(request: NextRequest) {
  try {
    // Get the request_uri parameter from the query string
    const requestUri = request.nextUrl.searchParams.get('request_uri');
    
    if (!requestUri) {
      console.error('Server-side API route: Missing request_uri parameter');
      return NextResponse.json(
        { error: 'Missing request_uri parameter' },
        { status: 400 }
      );
    }
    
    // Check if there are any other query parameters that need to be forwarded
    const queryParams = new URLSearchParams();
    
    // Add the request_uri parameter
    queryParams.append('request_uri', requestUri);
    
    // Get all other query parameters from the original request and add them
    // But skip the request_uri parameter since we've already added it
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (key !== 'request_uri') {
        queryParams.append(key, value);
      }
    }
    
    // For authorization, we need to redirect the user to the actual authorization URL
    // We can't proxy this through our API route
    const redirectUrl = `${AUTHORIZATION_SERVER_URL}/as/authorize?${queryParams.toString()}`;
    
    console.log(`Using authorization server URL: ${AUTHORIZATION_SERVER_URL}`);
    console.log(`Server-side API route: Redirecting to: ${redirectUrl}`);
    console.log(`Query parameters: ${queryParams.toString()}`);
    
    // Try to fetch the authorization URL first to check if it's accessible
    let useDirectConnection = true;
    let fallbackReason = '';
    
    try {
      // Use the same URL for the HEAD request as we'll use for the redirect
      console.log(`Checking if authorization server is accessible: ${redirectUrl}`);
      const checkResponse = await fetch(redirectUrl, {
        method: 'HEAD',
        headers: getApiGatewayHeaders(request)
      });
      
      console.log(`Authorization URL check status: ${checkResponse.status}`);
      
      if (!checkResponse.ok) {
        console.error(`Error checking authorization URL: ${checkResponse.status} ${checkResponse.statusText}`);
        useDirectConnection = false;
        fallbackReason = `Authorization server returned ${checkResponse.status} ${checkResponse.statusText}`;
      }
    } catch (error) {
      console.error(`Error checking authorization URL:`, error);
      useDirectConnection = false;
      fallbackReason = error instanceof Error ? error.message : 'Unknown error';
      
      // If the error is a connection error, show a more user-friendly error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return NextResponse.json(
          {
            error: 'authorization_server_unavailable',
            error_description: 'The authorization server is not available. Please ensure it is running.',
            details: error.message
          },
          { status: 503 }
        );
      }
    }
    
    // If direct connection failed, try using the API Gateway instead
    if (!useDirectConnection) {
      console.log(`Direct connection to authorization server failed: ${fallbackReason}`);
      console.log('Falling back to API Gateway for authorization');
      
      // Construct the API Gateway URL with the same query parameters
      const apiGatewayUrl = `${API_GATEWAY_URLS.PAYMENT_INITIATION}/as/authorize?${queryParams.toString()}`;
      console.log(`Redirecting to API Gateway: ${apiGatewayUrl}`);
      console.log(`Query parameters: ${queryParams.toString()}`);
      
      // Try to check if the API Gateway URL is accessible
      try {
        const checkResponse = await fetch(apiGatewayUrl, {
          method: 'HEAD',
          headers: getApiGatewayHeaders(request)
        });
        
        console.log(`API Gateway URL check status: ${checkResponse.status}`);
        
        if (!checkResponse.ok) {
          console.error(`Error checking API Gateway URL: ${checkResponse.status} ${checkResponse.statusText}`);
          return NextResponse.json(
            {
              error: 'Both direct connection and API Gateway failed',
              message: 'Unable to access authorization endpoint through either direct connection or API Gateway.',
              directError: fallbackReason,
              gatewayError: `${checkResponse.status} ${checkResponse.statusText}`
            },
            { status: 503 }
          );
        }
      } catch (error) {
        console.error(`Error checking API Gateway URL:`, error);
        return NextResponse.json(
          {
            error: 'Both direct connection and API Gateway failed',
            message: 'Unable to access authorization endpoint through either direct connection or API Gateway.',
            directError: fallbackReason,
            gatewayError: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 503 }
        );
      }
      
      // If we got here, the API Gateway URL is accessible
      return NextResponse.redirect(apiGatewayUrl);
    }
    
    // If direct connection was successful, proceed with the direct URL
    console.log(`Proceeding with direct connection to: ${redirectUrl}`);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Server-side API route: Error handling authorization redirect:', error);
    return NextResponse.json(
      { error: 'Failed to process authorization request' },
      { status: 500 }
    );
  }
}