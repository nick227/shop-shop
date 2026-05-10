import { AppError, type ValidationIssue } from './types'

type ErrorHandler = (details?: Record<string, unknown>) => AppError

const getIssues = (details?: Record<string, unknown>): ValidationIssue[] | undefined => {
  const issues = details?.issues
  return Array.isArray(issues) ? (issues as ValidationIssue[]) : undefined
}

export const httpErrorHandlers: Record<number, ErrorHandler> = {
  400: (details) => new AppError('Bad request', 'BAD_REQUEST', 400, details, getIssues(details)),
  401: (details) => new AppError('Unauthorized', 'UNAUTHORIZED', 401, details),
  /** Store cannot route card charges (Stripe Connect not ready). Prefer API body message when present. */
  402: (details) =>
    new AppError(
      'This store is not accepting online card payments yet. Please choose another payment option or contact the store.',
      'PAYMENT_UNAVAILABLE',
      402,
      details,
    ),
  403: (details) => new AppError('Forbidden', 'FORBIDDEN', 403, details),
  404: (details) => new AppError('Not found', 'NOT_FOUND', 404, details),
  409: (details) => new AppError('Conflict', 'CONFLICT', 409, details),
  422: (details) => new AppError('Validation error', 'VALIDATION_ERROR', 422, details, getIssues(details)),
  429: (details) => new AppError('Rate limited', 'RATE_LIMIT', 429, details),
  500: (details) => new AppError('Server error', 'SERVER_ERROR', 500, details),
  502: (details) => new AppError('Bad gateway', 'SERVER_ERROR', 502, details),
  503: (details) => new AppError('Service unavailable', 'SERVER_ERROR', 503, details),
  504: (details) => new AppError('Gateway timeout', 'SERVER_ERROR', 504, details),
}
