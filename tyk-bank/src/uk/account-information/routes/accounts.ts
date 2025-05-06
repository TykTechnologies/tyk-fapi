import { Router } from 'express';
import { getAccounts, getAccountById } from '../controllers/accounts';
import { getBalancesByAccount } from '../controllers/balances';
import { getTransactionsByAccount } from '../controllers/transactions';

const router = Router();

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts
 *     description: Retrieves a list of all accounts
 *     responses:
 *       200:
 *         description: A list of accounts
 */
router.get('/', getAccounts);

/**
 * @swagger
 * /accounts/{accountId}:
 *   get:
 *     summary: Get account by ID
 *     description: Retrieves account details by ID
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: ID of the account to retrieve
 *     responses:
 *       200:
 *         description: Account details
 *       404:
 *         description: Account not found
 */
router.get('/:accountId', getAccountById);

/**
 * @swagger
 * /accounts/{accountId}/balances:
 *   get:
 *     summary: Get account balances
 *     description: Retrieves balances for a specific account
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: ID of the account to retrieve balances for
 *     responses:
 *       200:
 *         description: Account balances
 *       404:
 *         description: Account not found
 */
router.get('/:accountId/balances', getBalancesByAccount);

/**
 * @swagger
 * /accounts/{accountId}/transactions:
 *   get:
 *     summary: Get account transactions
 *     description: Retrieves transactions for a specific account
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: ID of the account to retrieve transactions for
 *       - in: query
 *         name: fromBookingDateTime
 *         description: Filter transactions from this date/time (ISO format)
 *       - in: query
 *         name: toBookingDateTime
 *         description: Filter transactions until this date/time (ISO format)
 *     responses:
 *       200:
 *         description: Account transactions
 *       404:
 *         description: Account not found
 */
router.get('/:accountId/transactions', getTransactionsByAccount);

export default router;