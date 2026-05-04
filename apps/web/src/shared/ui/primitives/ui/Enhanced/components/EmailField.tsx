/**
 * Email Field Component
 * Extracted email input with smart suggestions and validation
 */
import { CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { MicroInteraction } from '../../Enhancements/MicroInteractions'
import { SmartSuggestion } from '../../Enhancements/SmartSuggestions'

interface EmailFieldProps {
  value: string
  suggestions: string[]
  validation: { isValid: boolean; message: string; isTouched: boolean }
  onSelect: (suggestion: string) => void
  onChange: (value: string) => void
  disabled?: boolean
}

export function EmailField({ 
  value, 
  suggestions, 
  validation, 
  onSelect, 
  onChange, 
  disabled 
}: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Email Address
        <span className="text-destructive ml-1">*</span>
      </label>
      
      <MicroInteraction variant="focus" intensity="medium">
        <SmartSuggestion
          value={value}
          suggestions={suggestions}
          onSelect={onSelect}
          onInputChange={onChange}
          placeholder="Enter your email"
          maxSuggestions={3}
          minLength={1}
          debounceMs={300}
          disabled={disabled}
          className="w-full"
        />
      </MicroInteraction>
      
      {/* Email Validation Feedback */}
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
            {validation.message || 'Email looks good!'}
          </span>
        </div>
      )}
    </div>
  )
}
