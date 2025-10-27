/**
 * Error Handlers - HTTP status code handlers
 */
import { AppError, type ValidationIssue } from './types'

type ErrorHandler = (body: Record<string, unknown> | undefined) => AppError

/**
 * Handle 400 Bad Request
 */
export function handleValidationError(body: Record<string, unknown> | undefined): AppError {
  const issues = body?.['issues'] as ValidationIssue[] | undefined
  
  if (issues && issues.length > 0) {
    const messages = issues.map((i) => i.path.join('.') + ': ' + i.message)
    return new AppError(
      'Validation failed: ' + messages.join(', '),
      'VALIDATION_ERROR',
      400,
      { issues }
    )
  }
  
  return new AppError(
    (body?.['error'] as string) || 'Invalid request',
    'BAD_REQUEST',
    400,
    body || undefined
  )
}

/**
 * Handle 401 Unauthorized with context-aware messaging
 */
export function handleUnauthorizedError(body: Record<string, unknown> | undefined): AppError {
  // Check if error is from server response
  const serverMessage = body?.['error'] as string
  
  // Use server message if provided, otherwise use context-appropriate default
  const message = serverMessage || 'Invalid email or password'
  
  return new AppError(message, 'UNAUTHORIZED', 401, body || undefined)
}

/**
 * HTTP status code to error handler mapping
 */
export const httpErrorHandlers: Record<number, ErrorHandler> = {
  400: handleValidationError,
  401: handleUnauthorizedError,
  403: () => new AppError('You do not have permission to perform this action', 'FORBIDDEN', 403),
  404: () => new AppError('Resource not found', 'NOT_FOUND', 404),
  409: (body) => new AppError(
    (body?.['error'] as string) || 'This item already exists',
    'CONFLICT',
    409,
    body || undefined
  ),
  422: (body) => new AppError(
    (body?.['error'] as string) || 'Unable to process request',
    'UNPROCESSABLE',
    422,
    body || undefined
  ),
  429: () => new AppError('Too many requests. Please try again in a moment.', 'RATE_LIMIT', 429),
  500: () => new AppError('Server error. Please try again later.', 'SERVER_ERROR', 500),
  502: () => new AppError('Server error. Please try again later.', 'SERVER_ERROR', 502),
  503: () => new AppError('Server error. Please try again later.', 'SERVER_ERROR', 503),
  504: () => new AppError('Server error. Please try again later.', 'SERVER_ERROR', 504),
}

