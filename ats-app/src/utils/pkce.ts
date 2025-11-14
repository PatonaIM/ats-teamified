/**
 * PKCE (Proof Key for Code Exchange) Utilities for OAuth 2.0
 * Implements RFC 7636 for secure public client authentication
 */

/**
 * Generate a cryptographically secure random string for code_verifier
 * Length: 43-128 characters (we use 128 for maximum entropy)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(96); // 96 bytes = 128 base64url characters
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate code_challenge from code_verifier using SHA-256
 * As per RFC 7636: code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Generate a cryptographically secure random state parameter
 * Used to prevent CSRF attacks
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Base64URL encoding (without padding)
 * As per RFC 4648 Section 5
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Store PKCE parameters in sessionStorage for callback validation
 */
export function storePKCEParams(params: {
  codeVerifier: string;
  state: string;
  redirectUri: string;
}): void {
  sessionStorage.setItem('pkce_code_verifier', params.codeVerifier);
  sessionStorage.setItem('pkce_state', params.state);
  sessionStorage.setItem('pkce_redirect_uri', params.redirectUri);
}

/**
 * Retrieve and validate PKCE parameters from sessionStorage
 */
export function retrievePKCEParams(): {
  codeVerifier: string;
  state: string;
  redirectUri: string;
} | null {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  const state = sessionStorage.getItem('pkce_state');
  const redirectUri = sessionStorage.getItem('pkce_redirect_uri');

  if (!codeVerifier || !state || !redirectUri) {
    return null;
  }

  return { codeVerifier, state, redirectUri };
}

/**
 * Clear PKCE parameters from sessionStorage after successful token exchange
 */
export function clearPKCEParams(): void {
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_state');
  sessionStorage.removeItem('pkce_redirect_uri');
}
