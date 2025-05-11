'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Account } from '@/types/accounts';
import { Balance } from '@/types/balances';
import { getAccountTypeDisplayName } from '@/lib/utils/displayNames';

interface AccountCardProps {
  account: Account;
  balances?: Balance[];
}

/**
 * Account card component for displaying account information
 */
export function AccountCard({ account, balances }: AccountCardProps) {
  // Find the available balance if it exists
  const availableBalance = balances?.find(
    (balance) => balance.AccountId === account.AccountId && 
    (balance.Type === 'ClosingAvailable' || balance.Type === 'InterimAvailable')
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{account.Nickname || `Account ${account.AccountId.slice(-4)}`}</span>
          <span className="text-sm font-normal bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {getAccountTypeDisplayName(account.AccountSubType || account.AccountType || 'Account')}
          </span>
        </CardTitle>
        <CardDescription>
          {account.Account.SchemeName}: {account.Account.Identification}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Currency</span>
            <span className="font-medium">{account.Currency}</span>
          </div>
          {availableBalance && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Available Balance</span>
              <span className="font-medium">
                {availableBalance.Amount.Amount} {availableBalance.Amount.Currency}
              </span>
            </div>
          )}
          {account.Status && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className="font-medium">{account.Status}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/accounts/${account.AccountId}`}>
          <Button variant="outline">View Details</Button>
        </Link>
        <Link href={`/payments?fromAccount=${account.AccountId}`}>
          <Button>Make Payment</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}