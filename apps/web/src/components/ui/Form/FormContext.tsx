/**
 * FormContext - Share form state and validation errors with FormField;
 */
/* eslint-disable react-refresh/only-export-components */
import { createContext } from 'react'

export interface FormContextValue {
  /** Validation errors by field name */
  errors: Record<string, string>
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether form data has been modified */
  isDirty: boolean;
  /** Whether form is valid (no errors) */
  isValid: boolean;
  /** Validate a specific field */
  validateField?: (fieldName: string, value: unknown) => void;
  /** Reset form to initial state */
  reset?: () => void;
}

export const FormContext = createContext<FormContextValue | null>(null)

export const FormProvider = FormContext.Provider;