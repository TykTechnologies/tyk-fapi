import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { consentId: string } }
) {
  const { consentId } = params;
  
  try {
    console.log(`Server-side API route: Checking funds availability for consent ${consentId} via API Gateway`);
    const response = await fetch(`${API_GATEWAY_URLS.PAYMENT_INITIATION}/domestic-payment-consents/${consentId}/funds-confirmation`);
    
    if (!response.ok) {
      console.error(`Error checking funds availability for consent ${consentId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to check funds availability: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully checked funds availability for consent ${consentId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error checking funds availability for consent ${consentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to check funds availability via API Gateway' },
      { status: 500 }
    );
  }
}