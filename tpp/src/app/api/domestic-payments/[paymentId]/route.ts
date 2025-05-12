import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const { paymentId } = params;
  
  try {
    console.log(`Server-side API route: Fetching payment ${paymentId} from API Gateway`);
    const response = await fetch(`${API_GATEWAY_URLS.PAYMENT_INITIATION}/domestic-payments/${paymentId}`);
    
    if (!response.ok) {
      console.error(`Error fetching payment ${paymentId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch payment: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched payment ${paymentId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching payment ${paymentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch payment from API Gateway' },
      { status: 500 }
    );
  }
}