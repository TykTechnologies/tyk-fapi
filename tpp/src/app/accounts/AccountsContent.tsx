'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/client/auth';
import Link from 'next/link';
import {useRouter} from "next/navigation";
import {useAuth} from "@/components/auth";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  transactions?: Transaction[];
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
}

interface OpenBankingAccount {
  AccountId: string;
  Status: string;
  Currency: string;
  AccountType: string;
  AccountSubType: string;
  Description: string;
  Nickname: string;
  Account: {
    Name: string;
    Identification: string;
  };
}

interface OpenBankingBalance {
  AccountId: string;
  Amount: {
    Amount: string;
    Currency: string;
  };
  CreditDebitIndicator: string;
  Type: string;
  DateTime: string;
}

interface OpenBankingTransaction {
  TransactionId: string;
  BookingDateTime: string;
  Amount: {
    Amount: string;
    Currency: string;
  };
  CreditDebitIndicator: string;
  Status: string;
  TransactionInformation: string;
}

/**
 * Accounts content component
 * This component displays the user's accounts using session cookie authentication
 */
export function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const dataFetchedRef = useRef(false);
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    // Skip the second fetch call in StrictMode
    if (dataFetchedRef.current) return;
    async function fetchAccountsAndBalances() {
      try {
        console.log(`[DEBUG] Starting to fetch accounts`);
        setIsLoading(true);
        setError(null);

        // Mark data as being fetched to prevent duplicate requests
        dataFetchedRef.current = true;

        // Fetch accounts using session cookie authentication
        console.log(`[DEBUG] Calling /api/accounts endpoint`);
        const accountsResponse = await fetchWithAuth('/api/accounts');
        
        if (!accountsResponse.ok) {
          if (accountsResponse.status === 401) {
            auth.setIsAuthenticated(false);
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch accounts');
        }

        const accountsData = await accountsResponse.json();
        console.log('Accounts API response:', accountsData);
        
        // Check if the response has the expected structure
        if (accountsData.Data && Array.isArray(accountsData.Data.Account)) {
          // Transform the Open Banking account format to our internal format
          const transformedAccounts = accountsData.Data.Account.map((account: OpenBankingAccount) => ({
            id: account.AccountId,
            name: account.Nickname || account.Description,
            type: `${account.AccountType} - ${account.AccountSubType}`,
            balance: 0, // Will be updated with actual balance
            currency: account.Currency
          }));
          
          // Fetch balances for all accounts
          console.log(`[DEBUG] Calling /api/balances endpoint`);
          const balancesResponse = await fetchWithAuth('/api/balances');
          
          if (balancesResponse.ok) {
            const balancesData = await balancesResponse.json();
            console.log('Balances API response:', balancesData);
            
            if (balancesData.Data && Array.isArray(balancesData.Data.Balance)) {
              // Update accounts with balances
              transformedAccounts.forEach((account: Account) => {
                const accountBalance = balancesData.Data.Balance.find(
                  (balance: OpenBankingBalance) => balance.AccountId === account.id
                );
                
                if (accountBalance) {
                  const amount = parseFloat(accountBalance.Amount.Amount);
                  account.balance = accountBalance.CreditDebitIndicator === 'Debit' ? -amount : amount;
                }
              });
            }
          } else {
            console.error('Failed to fetch balances');
          }
          
          setAccounts(transformedAccounts);
        } else if (accountsData.accounts) {
          // Handle the original expected format as a fallback
          setAccounts(accountsData.accounts);
        } else {
          console.error('Unexpected API response format:', accountsData);
          setAccounts([]);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to load accounts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccountsAndBalances();
  }, []);

  const handleAccountClick = async (account: Account) => {
    try {
      setIsLoadingTransactions(true);
      
      // Fetch transactions for the selected account
      const transactionsResponse = await fetchWithAuth(`/api/accounts/${account.id}/transactions`);
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        console.log('Transactions API response:', transactionsData);
        
        if (transactionsData.Data && Array.isArray(transactionsData.Data.Transaction)) {
          // Transform the Open Banking transaction format to our internal format
          const transformedTransactions = transactionsData.Data.Transaction.map((transaction: OpenBankingTransaction) => ({
            id: transaction.TransactionId,
            date: transaction.BookingDateTime,
            description: transaction.TransactionInformation,
            amount: parseFloat(transaction.Amount.Amount),
            currency: transaction.Amount.Currency,
            status: transaction.Status
          }));
          
          // Sort transactions by date (newest first)
          transformedTransactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Update the account with transactions
          const updatedAccount = { ...account, transactions: transformedTransactions };
          setSelectedAccount(updatedAccount);
        } else {
          // No transactions found
          setSelectedAccount({ ...account, transactions: [] });
        }
      } else {
        console.error('Failed to fetch transactions');
        setSelectedAccount(account);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setSelectedAccount(account);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedAccount(null);
  };

  // const handleMakePayment = (accountId: string) => {
  //   // Store the account ID in localStorage for the payment flow
  //   localStorage.setItem('sourceAccountId', accountId);
  //   // Redirect to the payments page
  //   window.location.href = '/payments';
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
        <p>No accounts found. Please connect to a bank to view your accounts.</p>
      </div>
    );
  }

  // If an account is selected, show its details and transactions
  if (selectedAccount) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCloseDetails}>
          ← Back to Accounts
        </Button>
        
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{selectedAccount.name}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-medium">{selectedAccount.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account ID</p>
              <p className="font-medium">{selectedAccount.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className="font-bold text-xl">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: selectedAccount.currency,
                }).format(selectedAccount.balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium">{selectedAccount.currency}</p>
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <Link href={`/payments?sourceAccountId=${selectedAccount.id}`}>
              <Button>Make Payment</Button>
            </Link>
          </div>
          
          <h3 className="text-xl font-bold mb-4">Transactions</h3>
          
          {isLoadingTransactions ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : selectedAccount.transactions && selectedAccount.transactions.length > 0 ? (
            <div className="space-y-2">
              {selectedAccount.transactions.map(transaction => (
                <div key={transaction.id} className="border rounded-md p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.status}
                    </p>
                  </div>
                  <p className={`font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: transaction.currency,
                    }).format(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No transactions found for this account.</p>
          )}
        </Card>
      </div>
    );
  }

  // Show the list of accounts
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {accounts.map((account) => (
        <Card key={account.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleAccountClick(account)}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{account.name}</h3>
              <p className="text-sm text-gray-500">{account.type}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${account.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: account.currency,
                }).format(account.balance)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}