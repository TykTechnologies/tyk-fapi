import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = params;
  
  try {
    console.log(`Server-side API route: Fetching account ${accountId} from API Gateway`);
    const response = await fetch(`${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/accounts/${accountId}`);
    
    if (!response.ok) {
      console.error(`Error fetching account ${accountId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch account: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched account ${accountId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching account ${accountId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch account from API Gateway' },
      { status: 500 }
    );
  }
}