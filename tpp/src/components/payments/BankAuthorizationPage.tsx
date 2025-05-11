'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePaymentConsent } from '@/hooks/usePayments';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

/**
 * Simulated bank authorization page component
 */
export function BankAuthorizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consentId = searchParams.get('consent_id');
  const redirectUri = searchParams.get('redirect_uri');
  
  const { 
    data: consentData, 
    isLoading, 
    isError,
    error
  } = usePaymentConsent(consentId || '');
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (isError || !consentData) {
    return (
      <ErrorState 
        message={`Error loading consent details: ${error instanceof Error ? error.message : 'Unknown error'}`} 
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  const consent = consentData.Data;
  
  const handleApprove = () => {
    // In a real implementation, this would call the bank's API to authorize the consent
    // For demo purposes, we'll redirect back to the TPP with a simulated authorization code
    const code = `code-${Math.random().toString(36).substring(2, 15)}`;
    const redirectUrl = new URL(redirectUri || '/');
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('state', searchParams.get('state') || '');
    
    window.location.href = redirectUrl.toString();
  };
  
  const handleReject = () => {
    // Redirect back to the TPP with an error
    const redirectUrl = new URL(redirectUri || '/');
    redirectUrl.searchParams.append('error', 'access_denied');
    redirectUrl.searchParams.append('error_description', 'The user rejected the authorization request');
    redirectUrl.searchParams.append('state', searchParams.get('state') || '');
    
    window.location.href = redirectUrl.toString();
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Tyk Bank</h1>
          <p className="text-gray-500">Secure Authorization</p>
        </div>
        
        <Card className="w-full">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b">
            <CardTitle>Authorize Payment</CardTitle>
            <CardDescription>
              A third-party provider is requesting authorization to make a payment on your behalf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <h3 className="font-medium">Payment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">
                  {consent.Initiation.InstructedAmount.Amount} {consent.Initiation.InstructedAmount.Currency}
                </span>
                
                <span className="text-gray-500">To</span>
                <span className="font-medium">
                  {consent.Initiation.CreditorAccount.Name}
                </span>
                
                <span className="text-gray-500">Account</span>
                <span className="font-medium">
                  {consent.Initiation.CreditorAccount.Identification}
                </span>
                
                {consent.Initiation.RemittanceInformation?.Reference && (
                  <>
                    <span className="text-gray-500">Reference</span>
                    <span className="font-medium">
                      {consent.Initiation.RemittanceInformation.Reference}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                By approving this request, you authorize Tyk Bank to process this payment on your behalf.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={handleApprove}
            >
              Approve
            </Button>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleReject}
            >
              Reject
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 Tyk Bank. All rights reserved.</p>
          <p className="mt-1">This is a simulated bank authorization page for demonstration purposes.</p>
        </div>
      </div>
    </div>
  );
}