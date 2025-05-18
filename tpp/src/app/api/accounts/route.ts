import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../config';
import { getSession, isAuthenticated, getAccessToken } from '@/lib/server/auth/session';
import { generateDpopProof, getKeyPair } from '@/lib/server/auth/oidcClient';

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[DEBUG] API route /api/accounts called (request ID: ${requestId})`);
  
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get('session_id')?.value;
    if (!sessionId) {
      console.error('Server-side API route: No session found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is authenticated
    const authenticated = await isAuthenticated(sessionId);
    if (!authenticated) {
      console.error('Server-side API route: User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get access token from session
    const accessToken = await getAccessToken(sessionId);
    if (!accessToken) {
      console.error('Server-side API route: No access token found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Generate DPoP proof for the request
    const url = `${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/accounts`;
    const keyPair = await getKeyPair();
    const dpopProof = await generateDpopProof('GET', url, keyPair);
    
    console.log(`[DEBUG] (${requestId}) Server-side API route: Fetching accounts from API Gateway`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `DPoP ${accessToken}`,
        'DPoP': dpopProof
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching accounts: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch accounts: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`[DEBUG] (${requestId}) Server-side API route: Successfully fetched accounts`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server-side API route: Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts from API Gateway' },
      { status: 500 }
    );
  }
}