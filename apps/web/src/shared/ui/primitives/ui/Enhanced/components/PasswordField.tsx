/**
 * Password Field Component
 * Extracted password input with visibility toggle and validation
 */
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { MicroInteraction } from '../../Enhancements/MicroInteractions'
import { RippleEffect } from '../../Enhancements/MicroInteractions'
import { Input } from '../../Input'

interface PasswordFieldProps {
  value: string
  showPassword: boolean
  validation: { isValid: boolean; message: string; isTouched: boolean }
  onChange: (value: string) => void
  onToggleVisibility: () => void
  disabled?: boolean
}

export function PasswordField({ 
  value, 
  showPassword, 
  validation, 
  onChange, 
  onToggleVisibility, 
  disabled 
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Password
        <span className="text-destructive ml-1">*</span>
      </label>
      
      <MicroInteraction variant="focus" intensity="medium">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your password"
            disabled={disabled}
            className={cn(
              'pr-10',
              validation.isTouched && !validation.isValid && 'border-destructive focus-visible:ring-destructive'
            )}
            autoComplete="current-password"
          />
          
          {/* Password Toggle Button */}
          <RippleEffect color="primary" duration={300}>
            <button
              type="button"
              onClick={onToggleVisibility}
              disabled={disabled}
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
      {validation.isTouched && (
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span className={cn(
            'text-sm',
            validation.isValid ? 'text-success' : 'text-destructive'
          )}>
            {validation.message || 'Password looks good!'}
          </span>
        </div>
      )}
    </div>
  )
}
