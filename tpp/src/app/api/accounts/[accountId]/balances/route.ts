import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../../config';
import { getSession, isAuthenticated, getAccessToken } from '@/lib/server/auth/session';
import { generateDpopProof, getKeyPair } from '@/lib/server/auth/oidcClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = await params;
  
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
    
    console.log(`Server-side API route: Fetching balances for account ${accountId} from API Gateway`);
    
    // Generate DPoP proof for the request
    const url = `${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/accounts/${accountId}/balances`;
    const keyPair = await getKeyPair();
    const dpopProof = await generateDpopProof('GET', url, keyPair);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `DPoP ${accessToken}`,
        'DPoP': dpopProof
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching balances for account ${accountId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch account balances: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched balances for account ${accountId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching balances for account ${accountId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch account balances from API Gateway' },
      { status: 500 }
    );
  }
}