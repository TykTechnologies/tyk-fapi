/**
 * Utility functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get common headers for API Gateway requests
 * @param request NextRequest object
 * @returns Headers object with common headers
 */
export function getApiGatewayHeaders(request: NextRequest): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Add additional headers that might be required by the API Gateway
    'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
    'X-Forwarded-Host': request.headers.get('host') || '',
    'X-Forwarded-Proto': 'http',
    // Pass through any authorization headers if present
    ...(request.headers.get('authorization') ? { 'Authorization': request.headers.get('authorization') || '' } : {})
  };
}

/**
 * Handle API Gateway response
 * @param response Fetch response from API Gateway
 * @param errorMessage Error message to log
 * @returns NextResponse with appropriate status and data
 */
export async function handleApiGatewayResponse(
  response: Response,
  errorMessage: string
): Promise<NextResponse> {
  if (!response.ok) {
    let errorData: any;
    try {
      // Try to parse the error response as JSON
      errorData = await response.json();
    } catch (e) {
      // If it's not JSON, get the text
      try {
        errorData = await response.text();
      } catch (e2) {
        errorData = 'Unknown error';
      }
    }
    
    console.error(`${errorMessage}: ${response.status} ${response.statusText}`, errorData);
    
    return NextResponse.json(
      { error: errorData || response.statusText },
      { status: response.status }
    );
  }
  
  try {
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error parsing API Gateway response:', error);
    return NextResponse.json(
      { error: 'Failed to parse API Gateway response' },
      { status: 500 }
    );
  }
}

/**
 * Make a request to the API Gateway
 * @param url API Gateway URL
 * @param options Fetch options
 * @param errorMessage Error message to log
 * @returns NextResponse with appropriate status and data
 */
export async function makeApiGatewayRequest(
  url: string,
  options: RequestInit,
  errorMessage: string
): Promise<NextResponse> {
  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, options);
    return handleApiGatewayResponse(response, errorMessage);
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return NextResponse.json(
      { error: 'Failed to connect to API Gateway' },
      { status: 500 }
    );
  }
}