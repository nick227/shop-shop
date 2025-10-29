/**
 * Enhanced Zod Error Handling
 * Provides comprehensive error handling and user-friendly error messages
 */

import { z } from 'zod'

export interface ValidationErrorDetails {
  field: string
  message: string
  code: string
  path: (string | number)[]
  received?: unknown
  expected?: string
}

export class EnhancedValidationError extends Error {
  public readonly name = 'EnhancedValidationError'
  public readonly details: ValidationErrorDetails[]
  public readonly field: string
  public readonly timestamp: Date

  constructor(
    message: string,
    details: ValidationErrorDetails[],
    field = 'unknown'
  ) {
    super(message)
    this.details = details
    this.field = field
    this.timestamp = new Date()
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.details.length === 0) return this.message

    const firstError = this.details[0]
    return this.formatFieldError(firstError)
  }

  /**
   * Get all field errors as a map
   */
  getFieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    
    for (const detail of this.details) {
      const fieldPath = detail.path.join('.')
      errors[fieldPath] = this.formatFieldError(detail)
    }
    
    return errors
  }

  /**
   * Check if error is for a specific field
   */
  hasFieldError(fieldPath: string): boolean {
    return this.details.some(detail => detail.path.join('.') === fieldPath)
  }

  /**
   * Get error for specific field
   */
  getFieldError(fieldPath: string): string | undefined {
    const detail = this.details.find(detail => detail.path.join('.') === fieldPath)
    return detail ? this.formatFieldError(detail) : undefined
  }

  /**
   * Format field error message
   */
  private formatFieldError(detail: ValidationErrorDetails): string {
    const fieldName = this.formatFieldName(detail.path)
    
    switch (detail.code) {
      case 'invalid_type': {
        return `${fieldName} must be ${detail.expected || 'valid'}`
      }
      case 'too_small': {
        return `${fieldName} is too short`
      }
      case 'too_big': {
        return `${fieldName} is too long`
      }
      case 'invalid_string': {
        return `${fieldName} format is invalid`
      }
      case 'invalid_email': {
        return `${fieldName} must be a valid email address`
      }
      case 'invalid_url': {
        return `${fieldName} must be a valid URL`
      }
      case 'invalid_date': {
        return `${fieldName} must be a valid date`
      }
      case 'custom': {
        return detail.message
      }
      default: {
        return detail.message || `${fieldName} is invalid`
      }
    }
  }

  /**
   * Format field name for display
   */
  private formatFieldName(path: (string | number)[]): string {
    if (path.length === 0) return 'Field'
    
    const fieldName = path[path.length - 1]
    if (typeof fieldName === 'number') {
      return `Item ${fieldName + 1}`
    }
    
    // Convert camelCase to Title Case
    return fieldName
      .replaceAll(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      userMessage: this.getUserMessage(),
      fieldErrors: this.getFieldErrors()
    }
  }
}

/**
 * Convert Zod error to enhanced validation error
 */
export function convertZodError(
  zodError: z.ZodError,
  fieldName = 'unknown'
): EnhancedValidationError {
  const details: ValidationErrorDetails[] = zodError.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
    path: issue.path,
    // received and expected are not available on all ZodIssue types
  }))

  const message = `Validation failed for ${fieldName}: ${details[0]?.message || 'Unknown error'}`
  
  return new EnhancedValidationError(message, details, fieldName)
}

/**
 * Enhanced validator factory with better error handling
 */
export function createEnhancedValidator<T>(
  schema: z.ZodSchema<T>,
  fieldName: string
) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw convertZodError(error, fieldName)
      }
      throw new EnhancedValidationError(
        `Unexpected validation error for ${fieldName}`,
        [{
          field: fieldName,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'custom',
          path: []
        }],
        fieldName
      )
    }
  }
}

/**
 * Safe validation that returns result instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fieldName = 'unknown'
): { success: true; data: T } | { success: false; error: EnhancedValidationError } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: convertZodError(error, fieldName) }
    }
    return {
      success: false,
      error: new EnhancedValidationError(
        `Unexpected validation error for ${fieldName}`,
        [{
          field: fieldName,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'custom',
          path: []
        }],
        fieldName
      )
    }
  }
}

/**
 * Batch validation for multiple items
 */
export function validateBatch<T>(
  schema: z.ZodSchema<T>,
  items: unknown[],
  fieldName = 'items'
): { success: true; data: T[] } | { success: false; errors: EnhancedValidationError[] } {
  const results: T[] = []
  const errors: EnhancedValidationError[] = []

  for (const [i, item] of items.entries()) {
    const result = safeValidate(schema, item, `${fieldName}[${i}]`)
    if (result.success) {
      results.push(result.data)
    } else {
      errors.push(result.error)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: results }
}

/**
 * Validation error handler for forms
 */
export class FormValidationHandler {
  private errors: Record<string, string> = {}

  /**
   * Set field error
   */
  setFieldError(field: string, message: string): void {
    this.errors[field] = message
  }

  /**
   * Clear field error
   */
  clearFieldError(field: string): void {
    delete this.errors[field]
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errors = {}
  }

  /**
   * Get field error
   */
  getFieldError(field: string): string | undefined {
    return this.errors[field]
  }

  /**
   * Get all errors
   */
  getAllErrors(): Record<string, string> {
    return { ...this.errors }
  }

  /**
   * Check if has errors
   */
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }

  /**
   * Handle validation error
   */
  handleValidationError(error: EnhancedValidationError): void {
    const fieldErrors = error.getFieldErrors()
    Object.assign(this.errors, fieldErrors)
  }

  /**
   * Validate field with schema
   */
  validateField<T>(
    field: string,
    value: unknown,
    schema: z.ZodSchema<T>
  ): boolean {
    try {
      schema.parse(value)
      this.clearFieldError(field)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const enhancedError = convertZodError(error, field)
        this.setFieldError(field, enhancedError.getUserMessage())
      } else {
        this.setFieldError(field, 'Invalid value')
      }
      return false
    }
  }
}
