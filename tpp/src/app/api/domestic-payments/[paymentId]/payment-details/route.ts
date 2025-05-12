import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const { paymentId } = params;
  
  try {
    console.log(`Server-side API route: Fetching payment details for ${paymentId} from API Gateway`);
    const response = await fetch(`${API_GATEWAY_URLS.PAYMENT_INITIATION}/domestic-payments/${paymentId}/payment-details`);
    
    if (!response.ok) {
      console.error(`Error fetching payment details for ${paymentId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch payment details: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched payment details for ${paymentId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching payment details for ${paymentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details from API Gateway' },
      { status: 500 }
    );
  }
}