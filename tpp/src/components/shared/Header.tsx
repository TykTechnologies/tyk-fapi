'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthStatus, useAuth } from '@/components/auth';

/**
 * Header component
 * This component displays the application header with navigation and authentication status
 */
export function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-white dark:bg-gray-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-blue-600">TPP</span>
            <span className="text-sm font-normal text-gray-500">FAPI 2.0 with DPoP</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm ${
                isActive('/') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            
            {/* Only show protected routes when authenticated */}
            {isAuthenticated && (
              <>
                <Link
                  href="/accounts"
                  className={`text-sm ${
                    isActive('/accounts') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Accounts
                </Link>
                <Link
                  href="/payments"
                  className={`text-sm ${
                    isActive('/payments') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Payments
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <AuthStatus className="hidden md:flex" />
          <button
            className="block md:hidden rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}