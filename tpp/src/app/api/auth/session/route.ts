import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth/session';

/**
 * Session endpoint
 * This endpoint returns the current session status
 */
export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get('session_id')?.value;
    console.log('Session API - Session ID from cookie:', sessionId);
    
    if (!sessionId) {
      console.log('Session API - No session ID found in cookie');
      return NextResponse.json({ isAuthenticated: false });
    }
    
    // Get session data
    const { data: session } = await getSession(sessionId);
    console.log('Session API - Session data:', JSON.stringify(session));
    
    // Return session status
    const isAuthenticated = !!session.isAuthenticated;
    console.log('Session API - isAuthenticated:', isAuthenticated);
    
    return NextResponse.json({
      isAuthenticated: isAuthenticated,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}