/**
 * Authentication Context
 * Manages global authentication state and user session
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  initiateLogin,
  validateToken,
  getStoredToken,
  storeUserProfile,
  logout as logoutUser,
  type UserProfile,
} from '../utils/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Validate stored token and restore session on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing authentication...');
        
        // Check for stored token
        const token = getStoredToken();
        if (!token) {
          console.log('[AuthContext] No stored token found');
          setIsLoading(false);
          return;
        }

        // Validate token with SSO provider
        const userProfile = await validateToken(token);
        if (userProfile) {
          setUser(userProfile);
          storeUserProfile(userProfile);
          console.log('[AuthContext] Session restored for user:', userProfile.email);
        } else {
          // Token validation failed - could be network issue or expired token
          // Keep token for now, user can retry. Only clear on explicit logout.
          console.warn('[AuthContext] Token validation failed, keeping session for retry');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Session initialization failed:', error);
        // Don't clear auth - allow transient failures to be retried
        // User can manually logout if needed
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Initiate OAuth login flow
   */
  const login = async () => {
    try {
      await initiateLogin();
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  /**
   * Logout user and clear session
   */
  const logout = () => {
    setUser(null);
    logoutUser();
  };

  /**
   * Refresh user profile from stored token
   * Throws error if validation fails (but doesn't clear storage)
   */
  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const userProfile = await validateToken(token);
    if (userProfile) {
      setUser(userProfile);
      storeUserProfile(userProfile);
    } else {
      // Token validation failed - don't clear yet, let callback handler decide
      setUser(null);
      throw new Error('Token validation failed');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
