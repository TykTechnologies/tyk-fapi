import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/server/auth/session';

/**
 * Logout endpoint
 * This endpoint clears the session and logs the user out
 */
export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get('session_id')?.value;
    if (sessionId) {
      // Delete session
      await deleteSession(sessionId);
    }
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    // Clear session cookie
    response.cookies.delete('session_id');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}