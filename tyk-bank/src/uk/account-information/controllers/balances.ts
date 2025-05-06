import { Request, Response } from 'express';
import { getAllBalances, getBalancesByAccountId } from '../data/balances';
import { getAccountById as fetchAccountById } from '../data/accounts';
import { Links, Meta } from '../../../common/types/common';

/**
 * Get all balances
 * @param req Express request
 * @param res Express response
 */
export const getBalances = (req: Request, res: Response) => {
  try {
    const balances = getAllBalances();
    
    const response = {
      Data: {
        Balance: balances
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
    console.error('Error getting balances:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get balances by account ID
 * @param req Express request
 * @param res Express response
 */
export const getBalancesByAccount = (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    // Check if account exists
    const account = fetchAccountById(accountId);
    if (!account) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Account with ID ${accountId} not found`
      });
    }
    
    const balances = getBalancesByAccountId(accountId);
    
    const response = {
      Data: {
        Balance: balances
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
    console.error('Error getting balances by account ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};