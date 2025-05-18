import { getJwks } from '@/lib/server/auth/oidcClient';
import { NextResponse } from 'next/server';

/**
 * JWKS endpoint to expose the public key for Keycloak
 * This endpoint will be available at http://localhost:3010/api/jwks
 */
export async function GET() {
  try {
    const jwks = await getJwks();
    
    return NextResponse.json(jwks, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error generating JWKS:', error);
    return NextResponse.json(
      { error: 'Failed to generate JWKS' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}