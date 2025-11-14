/**
 * OAuth Callback Handler Component
 * Handles the OAuth 2.0 redirect, exchanges authorization code for access token,
 * and redirects user to dashboard on success
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleCallback } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors
        if (errorParam) {
          const message = errorDescription || `OAuth error: ${errorParam}`;
          console.error('[AuthCallback] OAuth error:', message);
          setError(message);
          setIsProcessing(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setError('Invalid callback parameters. Missing code or state.');
          setIsProcessing(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        console.log('[AuthCallback] Processing OAuth callback...');

        // Exchange authorization code for access token
        await handleCallback(code, state);

        // Refresh user profile in auth context
        try {
          await refreshUser();
        } catch (err) {
          // Token validation failed after successful code exchange
          // This likely means SSO provider issue or network problem
          // Clear tokens and PKCE params since flow is broken
          console.error('[AuthCallback] Token validation failed:', err);
          throw new Error('Authentication succeeded but profile retrieval failed. Please try again.');
        }

        console.log('[AuthCallback] Authentication successful, redirecting to dashboard...');

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('[AuthCallback] Callback processing failed:', error);
        
        // Clear all auth data since the OAuth flow failed
        const { clearAuth } = await import('../utils/auth');
        clearAuth();
        
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(errorMessage);
        setIsProcessing(false);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In...</h2>
            <p className="text-gray-600">Please wait while we authenticate you with Teamified Accounts.</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
