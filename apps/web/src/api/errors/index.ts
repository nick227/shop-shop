/**
 * Error Handling - Simplified with handler map pattern
 */
import { ResponseError, FetchError } from '@packages/sdk'
import { AppError } from './types'
import { httpErrorHandlers } from './handlers'

export { AppError } from './types'
export type { ValidationIssue } from './types'

/**
 * Parse response body safely
 */
async function getResponseBody(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    return await response.clone().json() as Record<string, unknown>
  } catch {
    return undefined
  }
}

/**
 * Handle HTTP errors (ResponseError from SDK)
 */
async function handleResponseError(error: ResponseError): Promise<AppError> {
  const status = error.response.status
  const body = await getResponseBody(error.response)

  const handler = httpErrorHandlers[status] || httpErrorHandlers[500]
  if (!handler) {
    return new AppError('Unknown error', 'UNKNOWN', status, body || undefined)
  }
  return handler(body || undefined)
}

/**
 * Handle network errors (FetchError from SDK)
 */
function handleFetchError(error: FetchError): AppError {
  const cause = error.cause instanceof Error ? error.cause.message : undefined
  return new AppError(
    'Network error. Please check your internet connection.',
    'NETWORK_ERROR',
    undefined,
    { cause }
  )
}

/**
 * Handle unknown errors
 */
function handleUnknownError(error: any): AppError {
  if ((error) instanceof Error && error !== undefined) {
    return new AppError(error.message, 'GENERIC_ERROR')
  }
  return new AppError('An unexpected error occurred', 'UNKNOWN')
}

/**
 * Main error handler - Routes to appropriate handler
 */
export async function handleApiError(error: any): Promise<AppError> {
  if ((error) instanceof ResponseError && error !== undefined) {
    return await handleResponseError(error)
  }
  if ((error) instanceof FetchError && error !== undefined) {
    return handleFetchError(error)
  }
  return handleUnknownError(error)
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: AppError): string {
  const messages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    BAD_REQUEST: 'Invalid request. Please check your input.',
    UNAUTHORIZED: error.message, // Use the actual message from error (context-aware)
    FORBIDDEN: 'You do not have permission to do this.',
    NOT_FOUND: 'The requested item was not found.',
    CONFLICT: 'This item already exists.',
    UNPROCESSABLE: 'Unable to process your request.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NETWORK_ERROR: 'Connection problem. Check your internet.',
  }

  return messages[error.code] || error.message
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
  const recoverableCodes = ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMIT']
  return recoverableCodes.includes(error.code)
}

