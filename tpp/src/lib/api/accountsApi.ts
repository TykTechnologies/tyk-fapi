import axios from 'axios';
import { AccountResponse, AccountsResponse } from '@/types/accounts';
import { BalanceResponse, BalancesResponse } from '@/types/balances';

const API_URL = process.env.NEXT_PUBLIC_ACCOUNT_API_URL;

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
      const response = await axios.get<AccountsResponse>(`${API_URL}/accounts`);
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
  getAccountTransactions: async (accountId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/accounts/${accountId}/transactions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transactions for account ${accountId}:`, error);
      throw error;
    }
  }
};

export default accountsApi;