import { NextRequest, NextResponse } from 'next/server';

/**
 * This endpoint has been removed for FAPI 2.0 compliance
 *
 * In a FAPI 2.0 compliant architecture, the frontend must never directly access tokens
 * or generate DPoP proofs. All token operations should be handled by the backend.
 *
 * Instead, the frontend should use session cookies for authentication with the backend,
 * and the backend should handle all token operations when communicating with external APIs.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This endpoint has been removed for FAPI 2.0 compliance',
      message: 'Please use the session cookie for authentication with the backend'
    },
    { status: 410 } // Gone status code
  );
}