import { NextRequest, NextResponse } from 'next/server';
import { getKeyPair } from '@/lib/server/auth/oidcClient';
import { getSession, generateDpopProof } from '@/lib/server/auth/session';

/**
 * DPoP endpoint
 * This endpoint generates a DPoP proof for client-side requests
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
    const { method, url } = body;
    
    // Validate required parameters
    if (!method || !url) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get key pair for DPoP
    const keyPair = await getKeyPair();
    
    // Generate DPoP proof
    const dpopProof = await generateDpopProof(method, url, keyPair);
    
    // Return DPoP proof and access token
    return NextResponse.json({
      dpopProof,
      accessToken: session.accessToken
    });
  } catch (error) {
    console.error('DPoP error:', error);
    return NextResponse.json(
      { error: 'Failed to generate DPoP proof' },
      { status: 500 }
    );
  }
}