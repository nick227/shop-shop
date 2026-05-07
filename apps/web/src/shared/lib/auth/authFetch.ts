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
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
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
  
  // Debug logging to check token state
  console.log('[AuthFetch] Request:', {
    url,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
  })
  
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
  if (response.status === 401 && token && /^Bearer\s+\S+$/i.test((headers.get('Authorization') ?? '').trim())) {
    try {
      const errorResponse = await response.clone().json();
      const errorMessage = errorResponse.error || errorResponse.message || ''
      
      // Debug logging to understand the issue
      console.log('[AuthFetch] 401 Response:', {
        url: fullUrl,
        errorMessage,
        errorResponse
      })
      
      // Only logout for specific token invalidation errors
      const lower = errorMessage.toLowerCase()
      const isTokenInvalid = lower.includes('invalid token') ||
                         lower.includes('token invalid') ||
                         lower.includes('expired token') ||
                         lower.includes('token expired') ||
                         lower.includes('jwt expired') ||
                         lower.includes('jwt malformed')
      
      // Be more conservative - only logout for clear token invalidation
      // Also check if error message is not just a generic "Unauthorized"
      const isGenericUnauthorized = lower === 'unauthorized' || lower === 'authentication required'
      
      if (isTokenInvalid && !isGenericUnauthorized) {
        console.log('[AuthFetch] Logging out due to token invalidation:', errorMessage)
        // Clear auth state and dispatch logout event
        useAuthStore.getState().clearAuth()
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } else {
        console.log('[AuthFetch] Not logging out - generic unauthorized or missing token invalidation pattern')
      }
    } catch (error) {
      console.log('[AuthFetch] Error parsing 401 response:', error)
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
