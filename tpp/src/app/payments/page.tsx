'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithDPoP } from '@/lib/client/auth';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sourceAccountId, setSourceAccountId] = useState<string>('');
  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [destinationAccount, setDestinationAccount] = useState<string>('');
  const [destinationName, setDestinationName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [consentId, setConsentId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're returning from consent authorization
    const consentId = searchParams.get('consentId');
    if (consentId) {
      // We're returning from consent authorization, create the payment
      createPaymentWithConsent(consentId);
      return;
    }

    // Get source account ID from URL or localStorage
    const accountId = searchParams.get('sourceAccountId') || localStorage.getItem('sourceAccountId');
    if (accountId) {
      setSourceAccountId(accountId);
      fetchAccountDetails(accountId);
    } else {
      setIsLoading(false);
      setError('No source account selected. Please select an account to make a payment from.');
    }
  }, [searchParams]);

  const fetchAccountDetails = async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch account details
      const accountResponse = await fetchWithDPoP(`/api/accounts/${accountId}`);
      
      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account details');
      }

      const accountData = await accountResponse.json();
      console.log('Account details:', accountData);
      
      if (accountData.Data && accountData.Data.Account) {
        const account = accountData.Data.Account;
        
        // Fetch balance for this account
        const balanceResponse = await fetchWithDPoP(`/api/accounts/${accountId}/balances`);
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          console.log('Balance data:', balanceData);
          
          let balance = 0;
          if (balanceData.Data && balanceData.Data.Balance && balanceData.Data.Balance.length > 0) {
            const balanceInfo = balanceData.Data.Balance[0];
            const amount = parseFloat(balanceInfo.Amount.Amount);
            balance = balanceInfo.CreditDebitIndicator === 'Debit' ? -amount : amount;
          }
          
          setSourceAccount({
            id: account.AccountId,
            name: account.Nickname || account.Description,
            type: `${account.AccountType} - ${account.AccountSubType}`,
            balance,
            currency: account.Currency
          });
        } else {
          console.error('Failed to fetch balance');
          
          // Still set the account without balance
          setSourceAccount({
            id: account.AccountId,
            name: account.Nickname || account.Description,
            type: `${account.AccountType} - ${account.AccountSubType}`,
            balance: 0,
            currency: account.Currency
          });
        }
      } else {
        throw new Error('Invalid account data format');
      }
    } catch (err) {
      console.error('Error fetching account details:', err);
      setError('Failed to load account details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceAccount) {
      setError('No source account selected');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!destinationAccount) {
      setError('Please enter a destination account number');
      return;
    }
    
    if (!destinationName) {
      setError('Please enter the recipient name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create payment consent
      const consentResponse = await fetchWithDPoP('/api/payments/consents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Data: {
            Initiation: {
              InstructionIdentification: `INSTR-${Date.now()}`,
              EndToEndIdentification: `E2E-${Date.now()}`,
              InstructedAmount: {
                Amount: amount,
                Currency: sourceAccount.currency
              },
              CreditorAccount: {
                SchemeName: 'UK.OBIE.SortCodeAccountNumber',
                Identification: destinationAccount,
                Name: destinationName
              },
              RemittanceInformation: {
                Reference: reference || 'Payment'
              }
            }
          },
          Risk: {}
        })
      });
      
      if (!consentResponse.ok) {
        const errorData = await consentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment consent');
      }
      
      const consentData = await consentResponse.json();
      console.log('Payment consent created:', consentData);
      
      // Store the consent ID
      const consentId = consentData.Data.ConsentId;
      setConsentId(consentId);
      
      // Get the authorization URL for the consent
      const authResponse = await fetchWithDPoP(`/api/payments/consents/${consentId}/authorize`, {
        method: 'GET'
      });
      
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Failed to get authorization URL');
      }
      
      const authData = await authResponse.json();
      console.log('Authorization URL:', authData);
      
      // Set the authorization URL
      setAuthorizationUrl(authData.authorizationUrl);
      
    } catch (err) {
      console.error('Error creating payment consent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPaymentWithConsent = async (consentId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First, check the consent status
      console.log('Checking payment consent status:', consentId);
      const consentResponse = await fetchWithDPoP(`/api/payments/consents/${consentId}`, {
        method: 'GET'
      });
      
      if (!consentResponse.ok) {
        const errorData = await consentResponse.json();
        throw new Error(errorData.error || 'Failed to fetch payment consent');
      }
      
      const consentData = await consentResponse.json();
      console.log('Payment consent status:', consentData.Data.Status);
      
      // Now create payment with the consent
      // The API will handle the case where the consent is not authorized
      const paymentResponse = await fetchWithDPoP('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Data: {
            ConsentId: consentId,
            Initiation: consentData.Data.Initiation
          },
          Risk: {}
        })
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }
      
      const paymentData = await paymentResponse.json();
      console.log('Payment created:', paymentData);
      
      // Show success message
      setSuccessMessage(`Payment was successful! Payment ID: ${paymentData.Data.DomesticPaymentId}`);
      
      // Clear form
      setAmount('');
      setReference('');
      setDestinationAccount('');
      setDestinationName('');
      setConsentId(null);
      setAuthorizationUrl(null);
      
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = () => {
    if (authorizationUrl) {
      // Store the form data in localStorage so we can retrieve it after authorization
      localStorage.setItem('paymentAmount', amount);
      localStorage.setItem('paymentReference', reference);
      localStorage.setItem('paymentDestinationAccount', destinationAccount);
      localStorage.setItem('paymentDestinationName', destinationName);
      
      // Redirect to the authorization URL
      window.location.href = authorizationUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !sourceAccount) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p>{error}</p>
        <Button className="mt-4" onClick={() => router.push('/accounts')}>
          Go to Accounts
        </Button>
      </div>
    );
  }

  if (successMessage) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Payment Successful</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-md border border-green-200">
            <p className="text-green-700">{successMessage}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/accounts')}>
            Back to Accounts
          </Button>
          <Button onClick={() => setSuccessMessage(null)}>
            Make Another Payment
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (authorizationUrl) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authorize Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200 mb-4">
            <p className="text-blue-700">
              Your payment requires authorization. Please click the button below to authorize this payment with your bank.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-bold">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: sourceAccount?.currency || 'GBP',
                }).format(parseFloat(amount))}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium">{destinationName}</p>
              <p className="text-sm text-gray-500">{destinationAccount}</p>
            </div>
            
            {reference && (
              <div>
                <p className="text-sm text-gray-500">Reference</p>
                <p className="font-medium">{reference}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setAuthorizationUrl(null)}>
            Cancel
          </Button>
          <Button onClick={handleAuthorize}>
            Authorize Payment
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>
      
      {sourceAccount && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>From Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{sourceAccount.name}</p>
                <p className="text-sm text-gray-500">{sourceAccount.type}</p>
              </div>
              <p className={`font-bold ${sourceAccount.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: sourceAccount.currency,
                }).format(sourceAccount.balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="amount">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {sourceAccount?.currency || 'GBP'}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-12"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="destinationAccount">
                Recipient Account Number
              </label>
              <Input
                id="destinationAccount"
                placeholder="Enter account number"
                value={destinationAccount}
                onChange={(e) => setDestinationAccount(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="destinationName">
                Recipient Name
              </label>
              <Input
                id="destinationName"
                placeholder="Enter recipient name"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="reference">
                Reference (Optional)
              </label>
              <Input
                id="reference"
                placeholder="Enter payment reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push('/accounts')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}