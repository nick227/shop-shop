/**
 * Error Types;
 */

export interface ValidationIssue {
  path: string[]
  message: string
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

