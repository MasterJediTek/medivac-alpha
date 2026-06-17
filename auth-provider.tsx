import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CloudAuthService, type AuthSession } from './services/cloud-auth.service';

/**
 * Auth Context - Provides authentication state to entire app
 */

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithOAuth: (provider: 'microsoft' | 'google' | 'apple') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = CloudAuthService.getInstance();

  useEffect(() => {
    // Initialize auth on mount
    const initializeAuth = async () => {
      try {
        const currentSession = authService.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to session changes
    const unsubscribe = authService.subscribe((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  const handleSignInWithOAuth = async (provider: 'microsoft' | 'google' | 'apple') => {
    try {
      setIsLoading(true);
      await authService.signInWithOAuth(provider);
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.signInWithEmail(email, password);
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string, role: string) => {
    try {
      setIsLoading(true);
      await authService.register(email, password, name, role);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    isLoading,
    isAuthenticated: session?.isAuthenticated ?? false,
    signInWithOAuth: handleSignInWithOAuth,
    signInWithEmail: handleSignInWithEmail,
    register: handleRegister,
    logout: handleLogout,
    getAccessToken: () => authService.getAccessToken(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook - Access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
