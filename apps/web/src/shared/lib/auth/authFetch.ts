/**
 * Shared Authentication Fetch Helper
 * 
 * Single source of truth for authenticated API calls.
 * Reads token from useAuthStore, attaches Authorization header,
 * and handles 401 responses by clearing auth state.
 */

import { useAuthStore } from '@stores/authStore'

interface AuthFetchOptions extends RequestInit {
  // No additional options needed for now
}

interface AuthFetchResponse<T = unknown> extends Response {
  json(): Promise<T>
}

/**
 * Get base API URL consistently
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3005'
}

/**
 * Build consistent API paths
 */
export function apiPath(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${getApiBaseUrl()}/${cleanPath}`
}

/**
 * Authenticated fetch helper that reads token from useAuthStore
 * and handles authentication errors automatically.
 */
export async function authFetch<T = unknown>(
  url: string,
  options: AuthFetchOptions = {}
): Promise<AuthFetchResponse<T>> {
  const { token } = useAuthStore.getState()
  
    
  // Build full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : apiPath(url)
  
  // Prepare headers with authentication
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  // Set Content-Type for requests with body (except FormData)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  // Make the request
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  })
  
  // Handle 401 Unauthorized responses
  if (response.status === 401 && token && /^bearer\s+\S+$/i.test((headers.get('Authorization') ?? '').trim())) {
    try {
      const errorResponse = await response.clone().json();
      const errorMessage = errorResponse.error || errorResponse.message || ''
      
            
      const lower = errorMessage.toLowerCase()
      const isTokenInvalid = lower.includes('invalid token') ||
                         lower.includes('token invalid') ||
                         lower.includes('expired token') ||
                         lower.includes('token expired') ||
                         lower.includes('jwt expired') ||
                         lower.includes('jwt malformed') ||
                         lower.includes('user not found')

      if (isTokenInvalid) {
        useAuthStore.getState().clearAuth()
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    } catch {
      // Ignore error and continue
    }
  }
  
  // Return response with typed json method
  return response as AuthFetchResponse<T>
}

/**
 * Convenience method for GET requests
 */
export function authGet<T = unknown>(url: string, options?: Omit<AuthFetchOptions, 'method' | 'body'>): Promise<AuthFetchResponse<T>> {
  return authFetch<T>(url, { ...options, method: 'GET' })
}

/**
 * Public (non-auth) GET helper
 */
export async function publicGet<T = unknown>(
  url: string,
  options?: Omit<AuthFetchOptions, 'method' | 'body'>
): Promise<AuthFetchResponse<T>> {
  const fullUrl = url.startsWith('http') ? url : apiPath(url)
  const headers = new Headers(options?.headers)
  headers.set('Accept', 'application/json')
  return await fetch(fullUrl, { ...options, method: 'GET', headers }) as AuthFetchResponse<T>
}

/**
 * Convenience method for POST requests
 */
export function authPost<T = unknown>(url: string, data?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>): Promise<AuthFetchResponse<T>> {
  return authFetch<T>(url, {
    ...options,
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

/**
 * Convenience method for PUT requests
 */
export function authPut<T = unknown>(url: string, data?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>): Promise<AuthFetchResponse<T>> {
  return authFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

/**
 * Convenience method for DELETE requests
 */
export function authDelete<T = unknown>(url: string, options?: Omit<AuthFetchOptions, 'method' | 'body'>): Promise<AuthFetchResponse<T>> {
  return authFetch<T>(url, { ...options, method: 'DELETE' })
}

/**
 * Convenience method for PATCH requests
 */
export function authPatch<T = unknown>(url: string, data?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>): Promise<AuthFetchResponse<T>> {
  return authFetch<T>(url, {
    ...options,
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}
