'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/client/auth';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/**
 * Logout button component
 * This component handles the logout flow
 */
export function LogoutButton({
  className,
  variant = 'outline'
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      // The logout function will redirect to the home page
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      variant={variant}
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}