import { Request, Response } from 'express';
import {
  getAllTransactions,
  getTransactionsByAccountId,
  getTransactionsByAccountIdAndDateRange,
  createTransaction
} from '../data/transactions';
import { getAccountById as fetchAccountById } from '../data/accounts';
import { Links, Meta } from '../../../common/types/common';

/**
 * Get all transactions
 * @param req Express request
 * @param res Express response
 */
export const getTransactions = (req: Request, res: Response) => {
  try {
    const { fromBookingDateTime, toBookingDateTime } = req.query;
    
    // If date filters are provided, they should be valid ISO date strings
    if (
      (fromBookingDateTime && isNaN(Date.parse(fromBookingDateTime as string))) ||
      (toBookingDateTime && isNaN(Date.parse(toBookingDateTime as string)))
    ) {
      return res.status(400).json({
        ErrorCode: 'InvalidDateFormat',
        ErrorMessage: 'Date parameters must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }
    
    const transactions = getAllTransactions();
    
    const response = {
      Data: {
        Transaction: transactions
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get transactions by account ID
 * @param req Express request
 * @param res Express response
 */
export const getTransactionsByAccount = (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { fromBookingDateTime, toBookingDateTime } = req.query;
    
    // Check if account exists
    const account = fetchAccountById(accountId);
    if (!account) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Account with ID ${accountId} not found`
      });
    }
    
    // If date filters are provided, they should be valid ISO date strings
    if (
      (fromBookingDateTime && isNaN(Date.parse(fromBookingDateTime as string))) ||
      (toBookingDateTime && isNaN(Date.parse(toBookingDateTime as string)))
    ) {
      return res.status(400).json({
        ErrorCode: 'InvalidDateFormat',
        ErrorMessage: 'Date parameters must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }
    
    // Get transactions with optional date filtering
    const transactions = getTransactionsByAccountIdAndDateRange(
      accountId,
      fromBookingDateTime as string | undefined,
      toBookingDateTime as string | undefined
    );
    
    console.log(`[DEBUG] Transactions for account ${accountId}:`, JSON.stringify(transactions, null, 2));
    console.log(`[DEBUG] Total transactions found: ${transactions.length}`);
    
    // Log all transactions in the system to see if our new ones are there
    const allTransactions = getAllTransactions();
    console.log(`[DEBUG] All transactions in the system: ${allTransactions.length}`);
    console.log(`[DEBUG] All transactions with AccountId '${accountId}': ${allTransactions.filter(t => t.AccountId === accountId).length}`);
    
    const response = {
      Data: {
        Transaction: transactions
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {
        TotalPages: 1
      } as Meta
    };
    
    // Disable caching for this response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting transactions by account ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Create a transaction from a payment
 * @param req Express request
 * @param res Express response
 */
export const createTransactionFromPayment = (req: Request, res: Response) => {
  try {
    const transactionData = req.body;
    
    // Validate required fields
    if (!transactionData.AccountId) {
      return res.status(400).json({
        ErrorCode: 'InvalidRequest',
        ErrorMessage: 'AccountId is required'
      });
    }
    
    // Check if account exists
    const account = fetchAccountById(transactionData.AccountId);
    if (!account) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Account with ID ${transactionData.AccountId} not found`
      });
    }
    
    console.log(`Creating transaction for account ${transactionData.AccountId} from payment API`);
    
    // Create the transaction
    const newTransaction = createTransaction(transactionData);
    
    res.status(201).json({
      Data: {
        Transaction: newTransaction
      },
      Links: {
        Self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      } as Links,
      Meta: {} as Meta
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};