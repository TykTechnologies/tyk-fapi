import { Request, Response } from 'express';
import { getAllAccounts, getAccountById as fetchAccountById } from '../data/pg-accounts';
import { Links, Meta } from '../../../common/types/common';

/**
 * Get all accounts
 * @param req Express request
 * @param res Express response
 */
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await getAllAccounts();
    
    const response = {
      Data: {
        Account: accounts
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
    console.error('Error getting accounts:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};

/**
 * Get account by ID
 * @param req Express request
 * @param res Express response
 */
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const account = await fetchAccountById(accountId);
    
    if (!account) {
      return res.status(404).json({
        ErrorCode: 'ResourceNotFound',
        ErrorMessage: `Account with ID ${accountId} not found`
      });
    }
    
    const response = {
      Data: {
        Account: account
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
    console.error('Error getting account by ID:', error);
    res.status(500).json({
      ErrorCode: 'InternalServerError',
      ErrorMessage: 'An internal server error occurred'
    });
  }
};