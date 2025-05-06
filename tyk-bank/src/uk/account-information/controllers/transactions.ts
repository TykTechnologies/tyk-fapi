import { Request, Response } from 'express';
import { 
  getAllTransactions, 
  getTransactionsByAccountId, 
  getTransactionsByAccountIdAndDateRange 
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
    console.error('Error getting transactions by account ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};