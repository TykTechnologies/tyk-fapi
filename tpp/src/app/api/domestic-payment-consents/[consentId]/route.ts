import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { consentId: string } }
) {
  const { consentId } = params;
  
  try {
    console.log(`Server-side API route: Fetching payment consent ${consentId} from API Gateway`);
    const response = await fetch(`${API_GATEWAY_URLS.PAYMENT_INITIATION}/domestic-payment-consents/${consentId}`);
    
    if (!response.ok) {
      console.error(`Error fetching payment consent ${consentId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch payment consent: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched payment consent ${consentId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching payment consent ${consentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch payment consent from API Gateway' },
      { status: 500 }
    );
  }
}