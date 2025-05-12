import { NextResponse } from 'next/server';
import { API_GATEWAY_URLS } from '../config';

export async function GET() {
  try {
    console.log('Server-side API route: Fetching accounts from API Gateway');
    const response = await fetch(`${API_GATEWAY_URLS.ACCOUNT_INFORMATION}/accounts`);
    
    if (!response.ok) {
      console.error(`Error fetching accounts: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch accounts: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Server-side API route: Successfully fetched accounts');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server-side API route: Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts from API Gateway' },
      { status: 500 }
    );
  }
}