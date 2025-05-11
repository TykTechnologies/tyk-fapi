import { useQuery } from '@tanstack/react-query';
import React from 'react';
import accountsApi from '@/lib/api/accountsApi';
import { AccountResponse, AccountsResponse } from '@/types/accounts';
import { BalanceResponse, BalancesResponse } from '@/types/balances';
import { TransactionsResponse } from '@/types/transactions';

/**
 * Hook for fetching all accounts
 */
export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAccounts(),
  });
};

/**
 * Hook for fetching a specific account by ID
 * @param accountId Account ID
 */
export const useAccount = (accountId: string) => {
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: () => accountsApi.getAccountById(accountId),
    enabled: !!accountId,
  });
};

/**
 * Hook for fetching balances for all accounts
 */
export const useAllBalances = () => {
  return useQuery({
    queryKey: ['balances'],
    queryFn: () => accountsApi.getAllBalances(),
  });
};

/**
 * Hook for fetching balances for a specific account
 * @param accountId Account ID
 */
export const useAccountBalances = (accountId: string) => {
  return useQuery({
    queryKey: ['account-balances', accountId],
    queryFn: () => accountsApi.getAccountBalances(accountId),
    enabled: !!accountId,
  });
};

/**
 * Hook for fetching transactions for a specific account
 * @param accountId Account ID
 */
export const useAccountTransactions = (accountId: string) => {
  return useQuery({
    queryKey: ['account-transactions', accountId], // Remove timestamp to prevent continuous refreshing
    queryFn: () => accountsApi.getAccountTransactions(accountId),
    enabled: !!accountId,
    staleTime: 5000, // Consider data stale after 5 seconds
    gcTime: 30000, // Cache the data for 30 seconds
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};

/**
 * Hook for fetching accounts with their balances
 * This combines the results of useAccounts and useAllBalances
 */
export const useAccountsWithBalances = () => {
  const accountsQuery = useAccounts();
  const balancesQuery = useAllBalances();

  const isLoading = accountsQuery.isLoading || balancesQuery.isLoading;
  const isError = accountsQuery.isError || balancesQuery.isError;
  const error = accountsQuery.error || balancesQuery.error;

  // Combine accounts and balances data
  const data = React.useMemo(() => {
    if (!accountsQuery.data || !balancesQuery.data) return null;

    const accounts = accountsQuery.data.Data.Account;
    const balances = balancesQuery.data.Data.Balance;

    return accounts.map(account => {
      const accountBalances = balances.filter(balance => balance.AccountId === account.AccountId);
      return {
        ...account,
        balances: accountBalances,
      };
    });
  }, [accountsQuery.data, balancesQuery.data]);

  return {
    data,
    isLoading,
    isError,
    error,
  };
};