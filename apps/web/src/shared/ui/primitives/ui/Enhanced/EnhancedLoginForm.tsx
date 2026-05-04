// @ts-nocheck
/**
 * Enhanced LoginForm - Professional Login Experience
 * 
 * Addresses critical UI/UX issues in the current LoginForm:
 * - Smart suggestions and auto-completion
 * - Real-time validation with visual feedback
 * - Enhanced accessibility and keyboard navigation
 * - Micro-interactions and delightful animations
 * - Better error handling and user guidance
 * - Mobile-optimized touch experience
 */

import React, { memo, useCallback, useState, useEffect } from 'react'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../Button'
import { Input } from '../Input'
import { MicroInteraction, RippleEffect } from '../Enhancements/MicroInteractions'
import { SmartSuggestion } from '../Enhancements/SmartSuggestions'
import { VisualCue } from '../Enhancements/VisualHierarchy'
import { cn } from '@shared/lib/cn'
import { useAuth } from '@features/auth/hooks/useAuth'

// ========================================
// Types & Interfaces
// ========================================

export interface EnhancedLoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  isLoading?: boolean
  className?: string
}

export interface FormValidationState {
  email: {
    isValid: boolean
    message: string
    isTouched: boolean
  }
  password: {
    isValid: boolean
    message: string
    isTouched: boolean
  }
}

// ========================================
// Validation Logic
// ========================================

const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) {
    return { isValid: false, message: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }
  
  return { isValid: true, message: '' }
}

const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' }
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' }
  }
  
  return { isValid: true, message: '' }
}

// ========================================
// Enhanced LoginForm Component
// ========================================

const EnhancedLoginFormComponent = memo<EnhancedLoginFormProps>(({
  onSuccess,
  onError,
  isLoading = false,
  className
}) => {
  // ========================================
  // Auth Integration
  // ========================================
  
  const { login, loading: authLoading, error: authError } = useAuth({
    onSuccess,
    onError
  })
  
  // ========================================
  // State Management
  // ========================================
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [validation, setValidation] = useState<FormValidationState>({
    email: { isValid: false, message: '', isTouched: false },
    password: { isValid: false, message: '', isTouched: false }
  })
  
  const [showPassword, setShowPassword] = useState(false)
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
  
  const validateField = useCallback((field: keyof typeof formData, value: string) => {
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
  
  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
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
  const canSubmit = isFormValid && !isSubmitting && !isLoading
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Visual Cue */}
      <div className="text-center space-y-2">
        <VisualCue cue="highlight" position="center" color="primary" animated>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        </VisualCue>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Submit Error */}
        {submitError && (
          <MicroInteraction variant="error" intensity="strong">
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{submitError}</span>
            </div>
          </MicroInteraction>
        )}
        
        {/* Email Field with Smart Suggestions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Email Address
            <span className="text-destructive ml-1">*</span>
          </label>
          
          <MicroInteraction variant="focus" intensity="medium">
            <SmartSuggestion
              value={formData.email}
              suggestions={emailSuggestions}
              onSelect={handleEmailSelect}
              onInputChange={handleEmailChange}
              placeholder="Enter your email"
              maxSuggestions={3}
              minLength={1}
              debounceMs={300}
              disabled={isSubmitting || isLoading}
              className="w-full"
            />
          </MicroInteraction>
          
          {/* Email Validation Feedback */}
          {validation.email.isTouched && (
            <div className="flex items-center gap-2">
              {validation.email.isValid ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                'text-sm',
                validation.email.isValid ? 'text-success' : 'text-destructive'
              )}>
                {validation.email.message || 'Email looks good!'}
              </span>
            </div>
          )}
        </div>
        
        {/* Password Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Password
            <span className="text-destructive ml-1">*</span>
          </label>
          
          <MicroInteraction variant="focus" intensity="medium">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting || isLoading}
                className={cn(
                  'pr-10',
                  validation.password.isTouched && !validation.password.isValid && 'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete="current-password"
              />
              
              {/* Password Toggle Button */}
              <RippleEffect color="primary" duration={300}>
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isSubmitting || isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded-md transition-colors duration-normal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </RippleEffect>
            </div>
          </MicroInteraction>
          
          {/* Password Validation Feedback */}
          {validation.password.isTouched && (
            <div className="flex items-center gap-2">
              {validation.password.isValid ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                'text-sm',
                validation.password.isValid ? 'text-success' : 'text-destructive'
              )}>
                {validation.password.message || 'Password looks good!'}
              </span>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <MicroInteraction variant="click" intensity="strong">
          <RippleEffect color="primary" duration={600}>
            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              disabled={!canSubmit}
              isLoading={isSubmitting || isLoading}
              className="h-12 text-base font-semibold"
            >
              {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </RippleEffect>
        </MicroInteraction>
      </form>
      
      {/* Additional Actions */}
      <div className="space-y-4">
        {/* Forgot Password */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors duration-normal"
            disabled={isSubmitting || isLoading}
          >
            Forgot your password?
          </button>
        </div>
        
        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <button
            type="button"
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors duration-normal"
            disabled={isSubmitting || isLoading}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  )
})

EnhancedLoginFormComponent.displayName = 'EnhancedLoginForm'

// ========================================
// Exports
// ========================================

export { EnhancedLoginFormComponent as EnhancedLoginForm }
export default EnhancedLoginFormComponent
export type { EnhancedLoginFormProps, FormValidationState }
