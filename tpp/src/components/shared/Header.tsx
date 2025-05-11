'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Header component with navigation
 */
export function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Accounts', href: '/accounts' },
    { name: 'Payments', href: '/payments' },
  ];

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Banking TPP</h1>
        </div>
        <nav className="flex items-center space-x-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className="text-sm"
                >
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}