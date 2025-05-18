'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

/**
 * Protected route component
 * This component redirects unauthenticated users to the login page
 */
export function ProtectedRoute({
  children,
  fallbackUrl = '/',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip redirection if still loading
    if (isLoading) return;

    // Redirect to fallback URL if not authenticated
    if (!isAuthenticated) {
      // Encode the current path to redirect back after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${fallbackUrl}?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isLoading, router, pathname, fallbackUrl]);

  // Show nothing while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show children if authenticated
  return <>{children}</>;
}