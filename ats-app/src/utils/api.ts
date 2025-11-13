export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('.replit.dev')) {
      const protocol = window.location.protocol;
      const backendHostname = hostname.replace(/-5000-/, '-3001-').replace(/-00-/, '-3001-00-');
      return `${protocol}//${backendHostname}`;
    }
    
    return '';
  }
  
  return 'http://127.0.0.1:3001';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok && response.status !== 304) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    if (response.status === 204 || response.status === 304 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
