'use client';

import { useAuth } from './AuthProvider';
import { LoginButton } from './LoginButton';
import { LogoutButton } from './LogoutButton';

interface AuthStatusProps {
  className?: string;
}

/**
 * Authentication status component
 * This component displays the current authentication status and login/logout buttons
 */
export function AuthStatus({ className }: AuthStatusProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <span className="text-sm text-green-600 dark:text-green-400">
          Authenticated with DPoP
        </span>
        <LogoutButton variant="outline" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Not authenticated
      </span>
      <LoginButton variant="default" />
    </div>
  );
}