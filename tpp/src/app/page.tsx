'use client';

import React from 'react';
import { useAccountsWithBalances } from '@/hooks/useAccounts';
import { AccountCard } from '@/components/accounts/AccountCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

/**
 * Dashboard page component
 */
export default function Dashboard() {
  const { data: accountsWithBalances, isLoading, isError, error } = useAccountsWithBalances();

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={`Error loading accounts: ${error instanceof Error ? error.message : 'Unknown error'}`} 
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">
          View your accounts and make payments
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
        {accountsWithBalances && accountsWithBalances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountsWithBalances.map((account) => (
              <AccountCard 
                key={account.AccountId} 
                account={account} 
                balances={account.balances} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500">No accounts found</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <p className="text-gray-500 mb-4">
            Select an account above to view details or make a payment
          </p>
        </div>
      </div>
    </div>
  );
}
