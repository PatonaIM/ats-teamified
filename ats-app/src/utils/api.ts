export function getApiBaseUrl(): string {
  console.log('[API Debug] window.location.origin:', typeof window !== 'undefined' ? window.location?.origin : 'undefined');
  
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('[API] Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined' && window.location?.origin) {
    console.log('[API] Using window.location.origin:', window.location.origin);
    return window.location.origin;
  }
  
  console.log('[API] Using relative paths (fallback)');
  return '';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const timeout = options?.timeout || 30000;
  
  console.log('[API Request] Starting fetch to:', url, 'with timeout:', timeout + 'ms');
  
  // Get access token from sessionStorage (guard for SSR/tests)
  const accessToken = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('auth_access_token')
    : null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[API Request] Timeout after ${timeout}ms, aborting...`);
    controller.abort();
  }, timeout);
  
  try {
    console.log('[API Request] Calling fetch...');
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });
    
    console.log('[API Request] Response received:', response.status, response.statusText);
    clearTimeout(timeoutId);
    
    if (!response.ok && response.status !== 304) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    if (response.status === 204 || response.status === 304 || response.headers.get('content-length') === '0') {
      console.log('[API Request] Empty response, returning {}');
      return {} as T;
    }
    
    console.log('[API Request] Parsing JSON...');
    const data = await response.json();
    console.log('[API Request] Success! Data structure:', typeof data === 'object' ? Object.keys(data).join(', ') : typeof data);
    if (data.jobs) {
      console.log('[API Request] Received', data.jobs.length, 'jobs');
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[API Request] Error:', error);
    throw error;
  }
}
