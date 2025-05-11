'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OBTransaction, TransactionStatus } from '@/types/transactions';
import { CreditDebitIndicator } from '@/types/balances';

interface TransactionCardProps {
  transaction: OBTransaction;
}

/**
 * Transaction card component for displaying transaction information
 */
export function TransactionCard({ transaction }: TransactionCardProps) {
  const isCredit = transaction.CreditDebitIndicator === CreditDebitIndicator.CREDIT;
  const isPending = transaction.Status === TransactionStatus.PENDING;
  
  // Format date
  const formattedDate = new Date(transaction.BookingDateTime).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  return (
    <Card className="w-full mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="font-medium">
              {transaction.TransactionInformation || 'Transaction'}
              {isPending && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                  Pending
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">{formattedDate}</p>
            {transaction.MerchantDetails?.MerchantName && (
              <p className="text-xs text-gray-500">
                {transaction.MerchantDetails.MerchantName}
                {transaction.MerchantDetails.MerchantCategoryCode && (
                  <span className="ml-1 text-gray-400">
                    ({transaction.MerchantDetails.MerchantCategoryCode})
                  </span>
                )}
              </p>
            )}
          </div>
          <span className={`font-bold text-lg ${
            isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {isCredit ? '+' : '-'}
            {transaction.Amount.Amount} {transaction.Amount.Currency}
          </span>
        </div>
        
        {transaction.BankTransactionCode && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Transaction Type: {transaction.BankTransactionCode.Code}/{transaction.BankTransactionCode.SubCode}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}