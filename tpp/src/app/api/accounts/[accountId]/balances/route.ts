import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../../../config';

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = params;
  
  try {
    console.log(`Server-side API route: Fetching balances for account ${accountId} from API Gateway`);
    const response = await fetch(`${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/accounts/${accountId}/balances`);
    
    if (!response.ok) {
      console.error(`Error fetching balances for account ${accountId}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch account balances: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Server-side API route: Successfully fetched balances for account ${accountId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server-side API route: Error fetching balances for account ${accountId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch account balances from API Gateway' },
      { status: 500 }
    );
  }
}