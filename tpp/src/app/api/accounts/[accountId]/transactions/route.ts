import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  // Add cache-busting parameter similar to the client-side implementation
  const cacheBuster = Date.now();
  
  try {
    console.log(`Server-side API route: Fetching transactions for account ${accountId} from API Gateway`);
    
    // Construct URL with cache-busting parameter
    const url = `${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/accounts/${accountId}/transactions?_=${cacheBuster}`;
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching transactions for account ${accountId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch account transactions: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched ${data.Data.Transaction?.length || 0} transactions for account ${accountId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching transactions for account ${accountId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch account transactions from API Gateway' },
      { status: 500 }
    );
  }
}