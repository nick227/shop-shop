export interface ValidationIssue {
  path: string
  message: string
}

export class AppError extends Error {
  code: string
  status?: number
  details?: Record<string, unknown>
  issues?: ValidationIssue[]

  constructor(
    message: string,
    code: string,
    status?: number,
    details?: Record<string, unknown>,
    issues?: ValidationIssue[]
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
    this.issues = issues
  }
}
