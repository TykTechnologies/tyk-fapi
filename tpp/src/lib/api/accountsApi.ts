import axios from 'axios';
import { AccountResponse, AccountsResponse } from '@/types/accounts';
import { BalanceResponse, BalancesResponse } from '@/types/balances';
import { TransactionResponse, TransactionsResponse } from '@/types/transactions';

const API_URL = process.env.NEXT_PUBLIC_ACCOUNT_API_URL;

// Helper function to add a cache-busting parameter to URLs
const addCacheBuster = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
};

/**
 * API client for account information
 */
const accountsApi = {
  /**
   * Get all accounts
   * @returns Promise with accounts response
   */
  getAccounts: async (): Promise<AccountsResponse> => {
    try {
      const url = `${API_URL}/accounts`;
      console.log('Fetching accounts from URL:', url);
      const response = await axios.get<AccountsResponse>(url);
      console.log('Accounts API response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  /**
   * Get account by ID
   * @param accountId Account ID
   * @returns Promise with account response
   */
  getAccountById: async (accountId: string): Promise<AccountResponse> => {
    try {
      const response = await axios.get<AccountResponse>(`${API_URL}/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching account ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Get balances for all accounts
   * @returns Promise with balances response
   */
  getAllBalances: async (): Promise<BalancesResponse> => {
    try {
      const response = await axios.get<BalancesResponse>(`${API_URL}/balances`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all balances:', error);
      throw error;
    }
  },

  /**
   * Get balances for a specific account
   * @param accountId Account ID
   * @returns Promise with balance response
   */
  getAccountBalances: async (accountId: string): Promise<BalanceResponse> => {
    try {
      const response = await axios.get<BalanceResponse>(`${API_URL}/accounts/${accountId}/balances`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching balances for account ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Get transactions for a specific account
   * @param accountId Account ID
   * @returns Promise with transactions response
   */
  getAccountTransactions: async (accountId: string): Promise<TransactionsResponse> => {
    try {
      // Add cache-busting parameter to prevent caching
      const url = addCacheBuster(`${API_URL}/accounts/${accountId}/transactions`);
      console.log(`Fetching transactions from: ${url}`);
      
      const response = await axios.get<TransactionResponse>(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log(`Received ${response.data.Data.Transaction?.length || 0} transactions for account ${accountId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transactions for account ${accountId}:`, error);
      throw error;
    }
  }
};

export default accountsApi;