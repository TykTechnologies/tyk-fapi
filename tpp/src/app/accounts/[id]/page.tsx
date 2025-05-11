'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount, useAccountBalances, useAccountTransactions } from '@/hooks/useAccounts';
import { TransactionCard } from '@/components/accounts/TransactionCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { getAccountTypeDisplayName, getBalanceTypeDisplayName } from '@/lib/utils/displayNames';

/**
 * Account details page component
 */
export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const { 
    data: accountData, 
    isLoading: isAccountLoading, 
    isError: isAccountError,
    error: accountError
  } = useAccount(accountId);

  const { 
    data: balancesData, 
    isLoading: isBalancesLoading, 
    isError: isBalancesError,
    error: balancesError
  } = useAccountBalances(accountId);

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError
  } = useAccountTransactions(accountId);

  const isLoading = isAccountLoading || isBalancesLoading || isTransactionsLoading;
  const isError = isAccountError || isBalancesError || isTransactionsError;
  const error = accountError || balancesError || transactionsError;

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={`Error loading account details: ${error instanceof Error ? error.message : 'Unknown error'}`} 
        onRetry={() => window.location.reload()}
      />
    );
  }

  const account = accountData?.Data.Account;
  const balances = balancesData?.Data.Balance || [];
  const transactions = transactionsData?.Data.Transaction || [];

  if (!account) {
    return (
      <ErrorState 
        message="Account not found" 
        onRetry={() => router.push('/')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {account.Nickname || `Account ${account.AccountId.slice(-4)}`}
          </h1>
          <p className="text-gray-500">
            {account.Account.SchemeName}: {account.Account.Identification}
          </p>
        </div>
        <Button onClick={() => router.push(`/payments?fromAccount=${account.AccountId}`)}>
          Make Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-gray-500">Account Type</span>
              <span>{getAccountTypeDisplayName(account.AccountSubType || account.AccountType || 'N/A')}</span>
              
              <span className="text-sm text-gray-500">Currency</span>
              <span>{account.Currency}</span>
              
              <span className="text-sm text-gray-500">Status</span>
              <span>{account.Status || 'N/A'}</span>
              
              {account.OpeningDate && (
                <>
                  <span className="text-sm text-gray-500">Opening Date</span>
                  <span>{new Date(account.OpeningDate).toLocaleDateString()}</span>
                </>
              )}
              
              {account.AccountCategory && (
                <>
                  <span className="text-sm text-gray-500">Category</span>
                  <span>{account.AccountCategory}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>Current account balances</CardDescription>
          </CardHeader>
          <CardContent>
            {balances.length > 0 ? (
              <div className="space-y-4">
                {balances.map((balance, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{getBalanceTypeDisplayName(balance.Type)}</span>
                      <span className={`font-bold ${
                        balance.CreditDebitIndicator === 'Credit' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {balance.CreditDebitIndicator === 'Credit' ? '+' : '-'}
                        {balance.Amount.Amount} {balance.Amount.Currency}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date(balance.DateTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No balance information available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent account transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.TransactionId} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No transaction information available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}