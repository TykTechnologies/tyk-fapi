'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreatePayment } from '@/hooks/usePayments';
import { DomesticPaymentRequest } from '@/types/payments';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

/**
 * Callback page for handling authorization redirects
 */
export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  const createPaymentMutation = useCreatePayment();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for errors
        const errorParam = searchParams.get('error');
        if (errorParam) {
          const errorDescription = searchParams.get('error_description') || 'Unknown error';
          setError(`${errorParam}: ${errorDescription}`);
          setStatus('error');
          return;
        }
        
        // Get the authorization code and state
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code) {
          setError('No authorization code received');
          setStatus('error');
          return;
        }
        
        // In a real implementation, we would exchange the code for a token
        // For demo purposes, we'll simulate this step
        
        // Get the consent ID from session storage
        const consentId = sessionStorage.getItem('currentConsentId');
        const initiationData = sessionStorage.getItem('currentInitiationData');
        
        if (!consentId || !initiationData) {
          setError('Missing consent information');
          setStatus('error');
          return;
        }
        
        // Create the payment
        const paymentRequest: DomesticPaymentRequest = {
          Data: {
            ConsentId: consentId,
            Initiation: JSON.parse(initiationData),
          },
          Risk: {},
        };
        
        const paymentResponse = await createPaymentMutation.mutateAsync(paymentRequest);
        setPaymentId(paymentResponse.Data.DomesticPaymentId);
        setStatus('success');
        
        // Clear the session storage
        sessionStorage.removeItem('currentConsentId');
        sessionStorage.removeItem('currentInitiationData');
      } catch (err) {
        console.error('Error handling callback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };
    
    handleCallback();
  }, [searchParams, createPaymentMutation]);
  
  if (status === 'loading' || createPaymentMutation.isPending) {
    return <LoadingState message="Processing your payment..." />;
  }
  
  if (status === 'error') {
    return (
      <ErrorState 
        message={`Error processing payment: ${error}`} 
        onRetry={() => router.push('/payments')}
      />
    );
  }
  
  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Payment Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-green-800 dark:text-green-300">
              Your payment has been successfully processed.
            </p>
            {paymentId && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Payment ID: {paymentId}
              </p>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button onClick={() => router.push('/')}>
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}