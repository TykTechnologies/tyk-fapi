'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isAuthenticated as checkAuth } from '@/lib/client/auth';
import {toast} from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  checkAuthStatus: async () => {},
  setIsAuthenticated: () => {},
});

/**
 * Hook to use authentication context
 */
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * This component provides authentication state to the rest of the application
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authenticated = await checkAuth();
      setIsAuthenticated(authenticated);

      if (!authenticated && isAuthenticated) {
        toast.error('Your session has expired. Please log in again.');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        checkAuthStatus,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}