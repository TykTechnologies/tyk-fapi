'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import paymentsApi from '@/lib/api/paymentsApi';
import { useAuthorizePaymentConsent } from '@/hooks/usePayments';
import { DomesticPaymentConsentResponse } from '@/types/payments';

interface AuthorizationOptionsProps {
  consent: DomesticPaymentConsentResponse;
  requestUri: string;
  onAuthorized: () => void;
}

/**
 * Component for displaying authorization options
 */
export function AuthorizationOptions({ consent, requestUri, onAuthorized }: AuthorizationOptionsProps) {
  const router = useRouter();
  const authorizeConsentMutation = useAuthorizePaymentConsent();
  
  const handleAutomaticAuthorization = async () => {
    try {
      // Directly authorize the consent
      await authorizeConsentMutation.mutateAsync(consent.Data.ConsentId);
      onAuthorized();
    } catch (error) {
      console.error('Error authorizing consent:', error);
    }
  };
  
  const handleManualAuthorization = () => {
    // Get and store consent data for manual authorization
    
    // Get the consent data
    const consentId = consent.Data.ConsentId;
    const initiationData = JSON.stringify(consent.Data.Initiation);
    
    // Store in localStorage instead of sessionStorage (more persistent)
    try {
      localStorage.setItem('currentConsentId', consentId);
      localStorage.setItem('currentInitiationData', initiationData);
      // Consent data stored in localStorage
    } catch (error) {
      console.error(`Error storing in localStorage:`, error);
    }
    
    // Check if storage was successful
    const afterConsentId = localStorage.getItem('currentConsentId');
    const afterInitiationData = localStorage.getItem('currentInitiationData');
    // Verify storage was successful
    
    // Redirect to the authorization URL
    let authorizationUrl = paymentsApi.getAuthorizationUrl(requestUri);
    
    // Add consent ID to the URL as a parameter
    // First check if the URL already has parameters
    if (authorizationUrl.includes('?')) {
      authorizationUrl += `&tpp_consent_id=${encodeURIComponent(consentId)}`;
    } else {
      authorizationUrl += `?tpp_consent_id=${encodeURIComponent(consentId)}`;
    }
    
    // Double-check that the consent ID is in the URL
    // Ensure consent ID is in the URL
    if (!authorizationUrl.includes(consentId)) {
      authorizationUrl += `&tpp_consent_id=${encodeURIComponent(consentId)}`;
    }
    
    // Prepare for redirection
    
    try {
      // Store a flag to check if redirection happened
      localStorage.setItem('redirectionAttempted', 'true');
      
      // Perform the redirection
      window.location.href = authorizationUrl;
      
      // This might not execute if redirection is immediate
      // Redirection initiated
    } catch (error) {
      console.error(`Error during redirection:`, error);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authorize Payment</CardTitle>
        <CardDescription>Please authorize this payment to proceed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Payment Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="font-medium">
                {consent.Data.Initiation.InstructedAmount.Amount} {consent.Data.Initiation.InstructedAmount.Currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">To</span>
              <span className="font-medium">
                {consent.Data.Initiation.CreditorAccount.Name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account</span>
              <span className="font-medium">
                {consent.Data.Initiation.CreditorAccount.Identification}
              </span>
            </div>
            {consent.Data.Initiation.RemittanceInformation?.Reference && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="font-medium">
                  {consent.Data.Initiation.RemittanceInformation.Reference}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-medium mb-2">Authorization Options</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose how you want to authorize this payment:
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={handleAutomaticAuthorization}
              disabled={authorizeConsentMutation.isPending}
            >
              {authorizeConsentMutation.isPending ? 'Authorizing...' : 'Authorize Automatically'}
            </Button>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleManualAuthorization}
            >
              Authorize Manually
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant="secondary" 
          onClick={() => router.push('/')}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}