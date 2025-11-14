/**
 * Teamified Accounts SSO Authentication Utilities
 * OAuth 2.0 Authorization Code Flow with PKCE
 */

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  storePKCEParams,
  retrievePKCEParams,
  clearPKCEParams,
} from './pkce';

// Teamified SSO Configuration
const SSO_CONFIG = {
  authorizationUrl: 'https://teamified-accounts.replit.app/api/v1/sso/authorize',
  tokenUrl: 'https://teamified-accounts.replit.app/api/v1/sso/token',
  validationUrl: 'https://teamified-accounts.replit.app/api/v1/sso/validate',
  clientId: 'test-client',
  clientType: 'public',
};

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  [key: string]: any;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

/**
 * Get the OAuth callback redirect URI
 */
function getRedirectUri(): string {
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
}

/**
 * Initiate OAuth 2.0 authorization flow with PKCE
 * Redirects user to Teamified Accounts login page
 */
export async function initiateLogin(): Promise<void> {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();
    const redirectUri = getRedirectUri();

    // Store PKCE params for callback validation
    storePKCEParams({ codeVerifier, state, redirectUri });

    // Build authorization URL
    const authUrl = new URL(SSO_CONFIG.authorizationUrl);
    authUrl.searchParams.set('client_id', SSO_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('[Auth] Initiating OAuth flow:', {
      redirectUri,
      state: state.substring(0, 10) + '...',
      codeChallenge: codeChallenge.substring(0, 10) + '...',
    });

    // Redirect to authorization endpoint
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('[Auth] Failed to initiate login:', error);
    throw new Error('Failed to initiate login. Please try again.');
  }
}

/**
 * Handle OAuth callback and exchange authorization code for access token
 */
export async function handleCallback(
  code: string,
  state: string
): Promise<AuthTokens> {
  try {
    // Retrieve and validate PKCE parameters
    const pkceParams = retrievePKCEParams();
    if (!pkceParams) {
      throw new Error('PKCE parameters not found. Please restart login.');
    }

    // Validate state parameter (CSRF protection)
    if (state !== pkceParams.state) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    console.log('[Auth] Exchanging authorization code for access token...');

    // Exchange authorization code for access token
    const response = await fetch(SSO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: SSO_CONFIG.clientId,
        redirect_uri: pkceParams.redirectUri,
        code_verifier: pkceParams.codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Auth] Token exchange failed:', errorData);
      throw new Error(errorData.error_description || 'Failed to exchange authorization code');
    }

    const tokens: AuthTokens = await response.json();

    // Clear PKCE parameters after successful exchange
    clearPKCEParams();

    // Store access token in sessionStorage
    storeTokens(tokens);

    console.log('[Auth] Successfully obtained access token');
    return tokens;
  } catch (error) {
    console.error('[Auth] Callback handling failed:', error);
    clearPKCEParams();
    throw error;
  }
}

/**
 * Validate access token with SSO provider
 */
export async function validateToken(accessToken: string): Promise<UserProfile | null> {
  try {
    console.log('[Auth] Validating access token...');

    const response = await fetch(SSO_CONFIG.validationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('[Auth] Token validation failed:', response.status);
      return null;
    }

    const userProfile: UserProfile = await response.json();
    console.log('[Auth] Token valid, user profile retrieved:', userProfile.email);
    return userProfile;
  } catch (error) {
    console.error('[Auth] Token validation error:', error);
    return null;
  }
}

/**
 * Store authentication tokens in sessionStorage
 */
export function storeTokens(tokens: AuthTokens): void {
  sessionStorage.setItem('auth_access_token', tokens.access_token);
  if (tokens.refresh_token) {
    sessionStorage.setItem('auth_refresh_token', tokens.refresh_token);
  }
  if (tokens.expires_in) {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    sessionStorage.setItem('auth_expires_at', expiresAt.toString());
  }
}

/**
 * Retrieve access token from sessionStorage
 */
export function getStoredToken(): string | null {
  return sessionStorage.getItem('auth_access_token');
}

/**
 * Clear all authentication data from sessionStorage
 */
export function clearAuth(): void {
  sessionStorage.removeItem('auth_access_token');
  sessionStorage.removeItem('auth_refresh_token');
  sessionStorage.removeItem('auth_expires_at');
  sessionStorage.removeItem('auth_user_profile');
  clearPKCEParams();
  console.log('[Auth] Session cleared');
}

/**
 * Store user profile in sessionStorage
 */
export function storeUserProfile(profile: UserProfile): void {
  sessionStorage.setItem('auth_user_profile', JSON.stringify(profile));
}

/**
 * Retrieve user profile from sessionStorage
 */
export function getStoredUserProfile(): UserProfile | null {
  const profileJson = sessionStorage.getItem('auth_user_profile');
  if (!profileJson) return null;
  try {
    return JSON.parse(profileJson);
  } catch {
    return null;
  }
}

/**
 * Logout user and clear session
 */
export function logout(): void {
  clearAuth();
  window.location.href = '/';
}
