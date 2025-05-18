'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { startAuthorizationWithPar, startAuthorization } from '@/lib/client/auth';

interface LoginButtonProps {
  usePar?: boolean;
  scope?: string;
  redirectUri?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/**
 * Login button component
 * This component handles the login flow using DPoP
 */
export function LoginButton({
  usePar = true, // Use PAR by default for FAPI 2.0 compliance
  scope = 'openid profile',
  redirectUri,
  className,
  variant = 'default'
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Start authorization flow
      if (usePar) {
        // Use PAR (Pushed Authorization Request) - recommended for FAPI 2.0
        await startAuthorizationWithPar({ scope, redirectUri });
      } else {
        // Use direct authorization flow
        await startAuthorization({ scope, redirectUri });
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      className={className}
      variant={variant}
    >
      {isLoading ? 'Logging in...' : 'Login with DPoP'}
    </Button>
  );
}