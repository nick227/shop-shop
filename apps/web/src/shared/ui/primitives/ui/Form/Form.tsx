/**
 * Form Component - Simplified form wrapper with validation
 * Handles submission, validation, error state, and form state tracking
 */
import type { FormEvent, ReactNode} from 'react';
import { useState, useCallback, useMemo, useRef } from 'react'
import type { ZodSchema } from 'zod'
import { useFormValidation } from '@shared/hooks/useFormValidation'
import { Alert } from '../Alert'
import { FormProvider } from './FormContext'

export interface FormProps<T extends Record<string, unknown>> {
  /** Zod schema for validation */
  schema?: ZodSchema<T>
  /** Form submission handler */
  onSubmit: (data: T) => void | Promise<void>
  /** Success callback after successful submission */
  onSuccess?: () => void
  /** Error callback if submission fails */
  onError?: (error: Error) => void
  /** Form data object */
  data: T
  /** Child elements (FormField components) */
  children: ReactNode
  /** Error message from API or other sources */
  error?: string | undefined
  /** Loading state during submission */
  isLoading?: boolean
  /** Validate on field change (default: false) */
  validateOnChange?: boolean
  /** Validate on field blur (default: true) */
  validateOnBlur?: boolean
  /** Disable all form fields */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Shallow comparison for object equality
 */
function shallowEqual<T extends Record<string, unknown>>(obj1: T, obj2: T): boolean {
  const keys = Object.keys(obj1) as (keyof T)[]
  if (keys.length !== Object.keys(obj2).length) return false
  return keys.every(key => obj1[key] === obj2[key])
}

/**
 * Optimized Form component with context-based error sharing
 * 
 * @example
 * ```tsx
 * const [formData, setFormData] = useState({ email: '', password: '' })
 * 
 * <Form
 *   schema={loginSchema}
 *   data={formData}
 *   onSubmit={handleLogin}
 *   onSuccess={() => navigate('/dashboard')}
 *   validateOnBlur
 * >
 *   <FormField name="email" label="Email" type="email" />
 *   <FormField name="password" label="Password" type="password" />
 *   <Button type="submit">Login</Button>
 * </Form>
 * ```
 */
export function Form<T extends Record<string, unknown>>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  data,
  children,
  error,
  isLoading = false,
  validateOnChange: _validateOnChange = false,
  validateOnBlur: _validateOnBlur = true,
  disabled = false,
  className = '',
}: FormProps<T>) {
  // Always call hooks unconditionally (can't be conditional)
  const validation = useFormValidation(schema)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialDataRef = useRef(data)

  // Track if form has been modified (optimized with shallow comparison)
  const isDirty = useMemo(() => {
    return !shallowEqual(data, initialDataRef.current)
  }, [data])

  // Check if form is valid (no errors)
  const isValid = useMemo(() => {
    if (!schema || !validation) return true
    return Object.keys(validation.errors).length === 0
  }, [schema, validation])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Prevent double-submit
    if (isSubmitting) return

    // Validate if schema provided
    if (schema && validation && !validation.validate(data)) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(data)
      onSuccess?.()
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error('Submission failed')
      onError?.(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state (stable reference)
  const reset = useCallback(() => {
    // Reset errors if validation is available
    if (schema) {
      validation?.clearErrors()
    }
  }, [schema, validation])

  // Context value for FormField (optimized dependencies)
  const contextValue = useMemo(() => ({
    errors: (validation?.errors || {}) as Record<string, string>,
    isSubmitting: isSubmitting || isLoading || disabled,
    isDirty,
    isValid,
    validateField: validation?.validateField,
    reset,
  }), [
    validation?.errors,
    validation?.validateField,
    isSubmitting,
    isLoading,
    disabled,
    isDirty,
    isValid,
    reset,
  ])

  return (
    <FormProvider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={` ${className || ''}`}
        noValidate
      >
        {error && (
          <Alert variant="error" className="">
            {error}
          </Alert>
        )}
        {children}
      </form>
    </FormProvider>
  )
}
