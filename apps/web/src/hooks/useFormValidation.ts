/**
 * useFormValidation Hook - Simplified form validation with Zod
 * Supports full form and field-level validation
 * DEPRECATED: Use unified validation service instead
 * @deprecated Use @utils/validation/unified for new code
 */
import { useState, useCallback } from 'react'
import type { ZodSchema } from 'zod'
// import { validationService, type ValidationResult } from '@utils/validation/unified' // Removed due to missing export

export function useFormValidation<T extends Record<string, unknown>>(schema?: ZodSchema<T>) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  /**
   * Validate entire form
   */
  const validate = useCallback((data: T): boolean => {
    if (!schema) return true
    
    const result = schema.safeParse(data)
    
    if (result.success) {
      setErrors({})
      return true
    }

    // Extract errors from Zod
    const newErrors: Partial<Record<keyof T, string>> = {}
    for (const err of result.error.errors) {
      const field = err.path[0] as keyof T
      if (field) {
        newErrors[field] = err.message
      }
    }
    
    setErrors(newErrors)
    return false
  }, [schema])

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])
  
  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((field: keyof T, message: string) => {
    // @ts-expect-error - Complex generic constraint, works at runtime
    setErrors(prev => {
      if (!message) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [field]: message }
    })
  }, [])

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((field: keyof T) => {
    // @ts-expect-error - Complex generic constraint, works at runtime
    setErrors(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: removed, ...rest } = prev
      return rest
    })
  }, [])

  /**
   * Validate a single field with safe schema access
   * Only works with basic z.object() schemas
   * For refined/effect schemas, validation happens on full form submit
   */
  const validateField = useCallback((field: keyof T, value: unknown): boolean => {
    if (!schema) return true
    
    // Try to get field schema (only works with z.object schemas)
    const fieldSchema = (schema as { shape?: Record<string, unknown> })?.shape?.[field as string]
    
    if (!fieldSchema) {
      // Can't do field-level validation on refined/effect schemas
      // Validation will happen on form submit instead
      return true
    }
    
    // Validate individual field
    const result = (fieldSchema as any)?.safeParse?.(value)
    if (result.success) {
      clearFieldError(field)
      return true
    }
    
    const firstError = result.error.errors[0]
    if (firstError) {
      setFieldError(field, firstError.message)
    }
    return false
  }, [schema, setFieldError, clearFieldError])

  return { 
    errors, 
    validate, 
    validateField,
    clearErrors, 
    setFieldError,
    clearFieldError,
  }
}
