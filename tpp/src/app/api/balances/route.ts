import { NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../config';

export async function GET() {
  try {
    console.log('Server-side API route: Fetching all balances from API Gateway');
    const response = await fetch(`${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/balances`);
    
    if (!response.ok) {
      console.error(`Error fetching all balances: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch all balances: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Server-side API route: Successfully fetched all balances');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server-side API route: Error fetching all balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all balances from API Gateway' },
      { status: 500 }
    );
  }
}