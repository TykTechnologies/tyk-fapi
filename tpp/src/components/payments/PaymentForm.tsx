'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCreatePaymentConsent,
  usePushAuthorizationRequest,
  useAuthorizePaymentConsent,
  useCreatePayment
} from '@/hooks/usePayments';
import { useAccounts } from '@/hooks/useAccounts';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { getAccountTypeDisplayName, getPaymentStatusDisplayName } from '@/lib/utils/displayNames';
import { AuthorizationOptions } from './AuthorizationOptions';
import { DomesticPaymentConsentRequest, DomesticPaymentRequest } from '@/types/payments';

/**
 * Payment form component
 */
export function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAccountId = searchParams.get('fromAccount');

  // Payment flow steps
  type PaymentStep = 'form' | 'authorization' | 'processing' | 'complete';
  const [currentStep, setCurrentStep] = useState<PaymentStep>('form');

  const { data: accountsData, isLoading: isAccountsLoading, isError: isAccountsError } = useAccounts();
  
  // Use individual hooks instead of the combined flow
  const createConsentMutation = useCreatePaymentConsent();
  const pushAuthRequestMutation = usePushAuthorizationRequest();
  const authorizeConsentMutation = useAuthorizePaymentConsent();
  const createPaymentMutation = useCreatePayment();
  
  // Track consent and authorization data
  const [consentData, setConsentData] = useState<any>(null);
  const [requestUri, setRequestUri] = useState<string>('');

  const [formData, setFormData] = useState({
    accountId: fromAccountId || '',
    creditorName: '',
    creditorSchemeName: 'UK.OBIE.SortCodeAccountNumber',
    creditorIdentification: '',
    amount: '',
    currency: 'GBP',
    reference: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.accountId) errors.accountId = 'Please select an account';
    if (!formData.creditorName) errors.creditorName = 'Recipient name is required';
    if (!formData.creditorIdentification) errors.creditorIdentification = 'Account number is required';
    
    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Find the selected account details
      const selectedAccount = accounts.find(account => account.AccountId === formData.accountId);
      
      if (!selectedAccount) {
        setFormErrors({
          ...formErrors,
          accountId: 'Selected account not found'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Step 1: Create a payment consent
      const consentRequest: DomesticPaymentConsentRequest = {
        Data: {
          Initiation: {
            InstructionIdentification: `INSTR-${Date.now()}`,
            EndToEndIdentification: `E2E-${Date.now()}`,
            InstructedAmount: {
              Amount: formData.amount,
              Currency: formData.currency,
            },
            DebtorAccount: {
              SchemeName: selectedAccount.Account.SchemeName,
              Identification: selectedAccount.Account.Identification,
              Name: selectedAccount.Account.Name,
              SecondaryIdentification: selectedAccount.Account.SecondaryIdentification
            },
            CreditorAccount: {
              SchemeName: formData.creditorSchemeName,
              Identification: formData.creditorIdentification,
              Name: formData.creditorName,
            },
            RemittanceInformation: formData.reference
              ? { Reference: formData.reference }
              : undefined,
          },
        },
        Risk: {},
      };

      const consentResponse = await createConsentMutation.mutateAsync(consentRequest);
      setConsentData(consentResponse);
      
      // Store consent data in session storage for the callback
      sessionStorage.setItem('currentConsentId', consentResponse.Data.ConsentId);
      sessionStorage.setItem('currentInitiationData', JSON.stringify(consentRequest.Data.Initiation));

      // Step 2: Push authorization request (PAR)
      const parResponse = await pushAuthRequestMutation.mutateAsync({
        clientId: 'tpp-client',
        responseType: 'code',
        scope: 'payments',
        redirectUri: `${window.location.origin}/callback`,
        state: Math.random().toString(36).substring(2, 15),
        consentId: consentResponse.Data.ConsentId
      });
      
      setRequestUri(parResponse.request_uri);
      
      // Move to authorization step
      setCurrentStep('authorization');
    } catch (error) {
      console.error('Payment initiation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle automatic authorization
  const handleAuthorization = async () => {
    if (!consentData) return;
    
    setCurrentStep('processing');
    
    try {
      // Step 3: Create a payment using the authorized consent
      const paymentRequest: DomesticPaymentRequest = {
        Data: {
          ConsentId: consentData.Data.ConsentId,
          Initiation: consentData.Data.Initiation,
        },
        Risk: {},
      };
      
      // Ensure the DebtorAccount is included in the payment request
      console.log('Creating payment with consent data:', JSON.stringify(consentData.Data, null, 2));
      
      const result = await createPaymentMutation.mutateAsync(paymentRequest);
      setPaymentResult(result);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Payment failed:', error);
      setCurrentStep('form');
    }
  };

  if (isAccountsLoading) {
    return <LoadingState />;
  }

  if (isAccountsError) {
    return <ErrorState message="Error loading accounts" />;
  }
  
  // Show authorization options
  if (currentStep === 'authorization' && consentData && requestUri) {
    return (
      <AuthorizationOptions
        consent={consentData}
        requestUri={requestUri}
        onAuthorized={handleAuthorization}
      />
    );
  }
  
  // Show processing state
  if (currentStep === 'processing') {
    return <LoadingState message="Processing your payment..." />;
  }

  if (currentStep === 'complete' && paymentResult) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Successful</CardTitle>
          <CardDescription>Your payment has been processed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-green-800 dark:text-green-300 font-medium">
              Payment ID: {paymentResult.Data.DomesticPaymentId}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Status: {getPaymentStatusDisplayName(paymentResult.Data.Status)}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="font-medium">
                {paymentResult.Data.Initiation.InstructedAmount.Amount} {paymentResult.Data.Initiation.InstructedAmount.Currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">To</span>
              <span className="font-medium">
                {paymentResult.Data.Initiation.CreditorAccount.Name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account</span>
              <span className="font-medium">
                {paymentResult.Data.Initiation.CreditorAccount.Identification}
              </span>
            </div>
            {paymentResult.Data.Initiation.RemittanceInformation?.Reference && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="font-medium">
                  {paymentResult.Data.Initiation.RemittanceInformation.Reference}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/')}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const accounts = accountsData?.Data.Account || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Make a Payment</CardTitle>
        <CardDescription>Send money to another account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="accountId">
              From Account
            </label>
            <select
              id="accountId"
              name="accountId"
              value={formData.accountId}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                formErrors.accountId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.AccountId} value={account.AccountId}>
                  {account.Nickname || `Account ${account.AccountId.slice(-4)}`} - {getAccountTypeDisplayName(account.AccountSubType || account.AccountType || 'Account')} - {account.Account.Identification}
                </option>
              ))}
            </select>
            {formErrors.accountId && (
              <p className="text-sm text-red-500">{formErrors.accountId}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="creditorName">
              Recipient Name
            </label>
            <Input
              id="creditorName"
              name="creditorName"
              value={formData.creditorName}
              onChange={handleInputChange}
              className={formErrors.creditorName ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {formErrors.creditorName && (
              <p className="text-sm text-red-500">{formErrors.creditorName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="creditorIdentification">
              Account Number
            </label>
            <Input
              id="creditorIdentification"
              name="creditorIdentification"
              value={formData.creditorIdentification}
              onChange={handleInputChange}
              className={formErrors.creditorIdentification ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {formErrors.creditorIdentification && (
              <p className="text-sm text-red-500">{formErrors.creditorIdentification}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="amount">
                Amount
              </label>
              <Input
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={formErrors.amount ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {formErrors.amount && (
                <p className="text-sm text-red-500">{formErrors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="currency">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reference">
              Reference (Optional)
            </label>
            <Input
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          {(createConsentMutation.isError || pushAuthRequestMutation.isError || createPaymentMutation.isError) && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-red-800 dark:text-red-300">
                {createConsentMutation.error instanceof Error
                  ? createConsentMutation.error.message
                  : pushAuthRequestMutation.error instanceof Error
                    ? pushAuthRequestMutation.error.message
                    : createPaymentMutation.error instanceof Error
                      ? createPaymentMutation.error.message
                      : 'Payment failed. Please try again.'}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || createConsentMutation.isPending || pushAuthRequestMutation.isPending}
          >
            {isSubmitting || createConsentMutation.isPending || pushAuthRequestMutation.isPending
              ? 'Processing...'
              : 'Make Payment'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}