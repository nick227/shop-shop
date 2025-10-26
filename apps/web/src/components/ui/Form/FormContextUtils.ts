/**
 * FormContext utility hook;
 */
import { useContext } from 'react'
import { FormContext } from './FormContext'

/**
 * Hook to access form context in FormField;
 */
export function useFormContext() {
  // Return null if not in form context (allows standalone usage)
  return useContext(FormContext)
}

