'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

/**
 * Callback page for handling authorization redirects
 * This page redirects to the API callback endpoint to handle the authorization code exchange
 */
export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      console.log('Client-side callback page loaded with search params:', Object.fromEntries(searchParams.entries()));
      
      // Check for error parameter
      const errorParam = searchParams.get('error');
      if (errorParam) {
        const errorDescription = searchParams.get('error_description') || 'Unknown error';
        setError(`${errorParam}: ${errorDescription}`);
        return;
      }
      
      // Get the authorization code and state from the URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (!code) {
        setError('No authorization code found in the URL');
        return;
      }
      
      // Redirect to the API callback endpoint with the same query parameters
      const apiCallbackUrl = `/api/callback?${searchParams.toString()}`;
      console.log('Redirecting to API callback endpoint:', apiCallbackUrl);
      
      // Use window.location.href for a full page redirect to ensure the server-side API route is called
      window.location.href = apiCallbackUrl;
    };
    
    handleCallback();
  }, [searchParams, router]);
  
  if (error) {
    return (
      <ErrorState
        message={`Error: ${error}`}
        onRetry={() => router.push('/')}
      />
    );
  }
  
  return <LoadingState message="Processing your authentication..." />;
}