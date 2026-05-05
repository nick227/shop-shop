/**
 * Enhanced Login Form Hook
 * Extracts all state management and validation logic from the component
 */
import { useState, useCallback } from 'react'

export interface LoginFormData {
  email: string
  password: string
}

export interface FormValidationState {
  email: { isValid: boolean; message: string; isTouched: boolean }
  password: { isValid: boolean; message: string; isTouched: boolean }
}

export interface UseLoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useLoginForm({ onSuccess, onError }: UseLoginFormProps = {}) {
  // ========================================
  // State Management
  // ========================================
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  
  const [validation, setValidation] = useState<FormValidationState>({
    email: { isValid: false, message: '', isTouched: false },
    password: { isValid: false, message: '', isTouched: false }
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  // ========================================
  // Smart Suggestions
  // ========================================
  
  const emailSuggestions = [
    'user@example.com',
    'admin@company.com',
    'test@domain.com'
  ]
  
  // ========================================
  // Validation Functions
  // ========================================
  
  const validateField = useCallback((field: keyof LoginFormData, value: string) => {
    let result: { isValid: boolean; message: string }
    
    if (field === 'email') {
      result = validateEmail(value)
    } else if (field === 'password') {
      result = validatePassword(value)
    } else {
      return
    }
    
    setValidation(prev => ({
      ...prev,
      [field]: {
        ...result,
        isTouched: true
      }
    }))
  }, [])
  
  const validateForm = useCallback(() => {
    const emailValidation = validateEmail(formData.email)
    const passwordValidation = validatePassword(formData.password)
    
    setValidation({
      email: { ...emailValidation, isTouched: true },
      password: { ...passwordValidation, isTouched: true }
    })
    
    return emailValidation.isValid && passwordValidation.isValid
  }, [formData])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleFieldChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSubmitError('')
    
    // Real-time validation
    validateField(field, value)
  }, [validateField])
  
  const handleEmailChange = useCallback((value: string) => {
    handleFieldChange('email', value)
  }, [handleFieldChange])
  
  const handlePasswordChange = useCallback((value: string) => {
    handleFieldChange('password', value)
  }, [handleFieldChange])
  
  const handleEmailSelect = useCallback((suggestion: string) => {
    handleFieldChange('email', suggestion)
  }, [handleFieldChange])
  
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock authentication logic
      if (formData.email === 'test@example.com' && formData.password === 'password') {
        onSuccess?.()
      } else {
        throw new Error('Invalid email or password')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setSubmitError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, onSuccess, onError])
  
  // ========================================
  // Computed Values
  // ========================================
  
  const isFormValid = validation.email.isValid && validation.password.isValid
  const isFormTouched = validation.email.isTouched && validation.password.isTouched
  const canSubmit = isFormValid && !isSubmitting
  
  return {
    // State
    formData,
    validation,
    showPassword,
    isSubmitting,
    submitError,
    
    // Suggestions
    emailSuggestions,
    
    // Handlers
    handleEmailChange,
    handlePasswordChange,
    handleEmailSelect,
    togglePasswordVisibility,
    handleSubmit,
    
    // Computed values
    isFormValid,
    isFormTouched,
    canSubmit
  }
}

// ========================================
// Validation Utilities
// ========================================

function validateEmail(email: string): { isValid: boolean; message: string } {
  if (!email) {
    return { isValid: false, message: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }
  
  return { isValid: true, message: '' }
}

function validatePassword(password: string): { isValid: boolean; message: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' }
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  
  // Check for at least one letter
  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter' }
  }
  
  return { isValid: true, message: '' }
}
