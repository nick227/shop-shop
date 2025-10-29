/**
 * Standardized Error Handling for SDK Hooks
 * 
 * Provides consistent error handling patterns across all hooks:
 * 1. Centralized error processing
 * 2. User-friendly error messages
 * 3. Error categorization and logging
 * 4. Retry strategies
 * 5. Error boundary integration
 */

import { handleApiError, type AppError } from '@api/errors'
import { toast } from 'sonner'

// ============================================
// Error Categories
// ============================================

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export interface CategorizedError extends AppError {
  category: ErrorCategory
  userMessage: string
  shouldRetry: boolean
  retryAfter?: number
}

// ============================================
// Error Processing
// ============================================

/**
 * Process and categorize API errors
 */
export async function processApiError(error: unknown): Promise<CategorizedError> {
  const appError = await handleApiError(error)
  
  // Categorize error based on status code and message
  const category = categorizeError(appError)
  const userMessage = getUserFriendlyMessage(appError, category)
  const shouldRetry = shouldRetryError(appError, category)
  const retryAfter = getRetryDelay(appError, category)

  return {
    ...appError,
    category,
    userMessage,
    shouldRetry,
    retryAfter
  }
}

/**
 * Categorize error based on status code and content
 */
function categorizeError(error: AppError): ErrorCategory {
  const status = error.status || 0
  const message = error.message?.toLowerCase() || ''

  // Network errors
  if (status === 0 || status >= 500) {
    return ErrorCategory.NETWORK
  }

  // Authentication errors
  if (status === 401 || message.includes('unauthorized') || message.includes('token')) {
    return ErrorCategory.AUTHENTICATION
  }

  // Authorization errors
  if (status === 403 || message.includes('forbidden') || message.includes('permission')) {
    return ErrorCategory.AUTHORIZATION
  }

  // Not found errors
  if (status === 404 || message.includes('not found')) {
    return ErrorCategory.NOT_FOUND
  }

  // Validation errors
  if (status === 400 || message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION
  }

  // Server errors
  if (status >= 500) {
    return ErrorCategory.SERVER
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error: AppError, category: ErrorCategory): string {
  const messages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: 'Network connection issue. Please check your internet connection and try again.',
    [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
    [ErrorCategory.AUTHENTICATION]: 'Please log in to continue.',
    [ErrorCategory.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
    [ErrorCategory.NOT_FOUND]: 'The requested item could not be found.',
    [ErrorCategory.SERVER]: 'Server error. Please try again later.',
    [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.'
  }

  // Use specific error message if available and user-friendly
  if (error.message && isUserFriendlyMessage(error.message)) {
    return error.message
  }

  return messages[category]
}

/**
 * Check if error message is user-friendly
 */
function isUserFriendlyMessage(message: string): boolean {
  const technicalTerms = [
    'internal server error',
    'unexpected token',
    'syntax error',
    'reference error',
    'type error',
    'network error',
    'timeout',
    'cors',
    'csp',
    'xss'
  ]

  return !technicalTerms.some(term => message.toLowerCase().includes(term))
}

/**
 * Determine if error should be retried
 */
function shouldRetryError(error: AppError, category: ErrorCategory): boolean {
  // Don't retry client errors (4xx) except network issues
  if (error.status && error.status >= 400 && error.status < 500) {
    return category === ErrorCategory.NETWORK
  }

  // Retry server errors and network issues
  return category === ErrorCategory.SERVER || category === ErrorCategory.NETWORK
}

/**
 * Get retry delay in milliseconds
 */
function getRetryDelay(error: AppError, category: ErrorCategory): number | undefined {
  if (!shouldRetryError(error, category)) {
    return undefined
  }

  // Exponential backoff based on error type
  const baseDelay = category === ErrorCategory.NETWORK ? 1000 : 2000
  const maxDelay = 30_000 // 30 seconds max

  // Use retry-after header if available
  if (error.retryAfter) {
    return Math.min(error.retryAfter * 1000, maxDelay)
  }

  return Math.min(baseDelay, maxDelay)
}

// ============================================
// Error Handling Hooks
// ============================================

/**
 * useErrorHandler - Hook for consistent error handling
 */
export function useErrorHandler() {
  const handleError = (error: CategorizedError, options?: {
    showToast?: boolean
    logError?: boolean
    onRetry?: () => void
  }) => {
    const { showToast = true, logError = true, onRetry } = options || {}

    // Log error for debugging
    if (logError) {
      console.error(`[${error.category.toUpperCase()}] ${error.message}`, {
        status: error.status,
        category: error.category,
        shouldRetry: error.shouldRetry,
        retryAfter: error.retryAfter
      })
    }

    // Show user-friendly message
    if (showToast) {
      toast.error(error.userMessage, {
        duration: error.category === ErrorCategory.NETWORK ? 5000 : 3000,
        action: error.shouldRetry && onRetry ? {
          label: 'Retry',
          onClick: onRetry
        } : undefined
      })
    }

    // Handle specific error categories
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION: {
        // Trigger logout flow
        window.dispatchEvent(new CustomEvent('auth:logout'))
        break
      }
      
      case ErrorCategory.NETWORK: {
        // Could trigger network status monitoring
        break
      }
      
      default: {
        // No special handling needed
        break
      }
    }
  }

  return { handleError }
}

// ============================================
// Query/Mutation Error Handling
// ============================================

/**
 * Standard error handler for useQuery
 */
export function createQueryErrorHandler() {
  return async (error: unknown) => {
    throw await processApiError(error)
  }
}

/**
 * Standard error handler for useMutation
 */
export function createMutationErrorHandler() {
  return async (error: unknown) => {
    throw await processApiError(error)
  }
}

/**
 * Standard onError handler for mutations
 */
export function createMutationOnError() {
  const { handleError } = useErrorHandler()
  
  return (error: CategorizedError) => {
    handleError(error, {
      showToast: true,
      logError: true
    })
  }
}

// ============================================
// Retry Strategies
// ============================================

/**
 * Standard retry configuration for queries
 */
export const queryRetryConfig = {
  retry: (failureCount: number, error: unknown): boolean => {
    // Don't retry on client errors (4xx)
    if (error && typeof error === 'object' && 'status' in error && 
        typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
      return false
    }
    
    // Retry up to 3 times for server errors
    return failureCount < 3
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000)
}

/**
 * Standard retry configuration for mutations
 */
export const mutationRetryConfig = {
  retry: (failureCount: number, error: unknown): boolean => {
    // Only retry network errors for mutations
    return failureCount < 2 && error && typeof error === 'object' && 
           'category' in error && error.category === ErrorCategory.NETWORK
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10_000)
}
