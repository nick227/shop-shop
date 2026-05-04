/**
 * FormField Component - Simplified field wrapper with auto-error from context;
 * Works with Form component (auto-errors) or standalone (manual errors)
 */
import type { ReactNode} from 'react';
import { useCallback } from 'react'
import { Input, type InputProps } from '../Input'
import { useFormContext } from '../Form/FormContextUtils'

export interface FormFieldProps extends Omit<InputProps, 'label'> {
  /** Field name/identifier */
  name: string;
  /** Field label */
  label: string;
  /** Validation error message (optional, auto-fetched from Form context if available) */
  error?: string;
  /** Helper text displayed below field */
  helperText?: string;
  /** Custom input component (defaults to Input) */
  children?: ReactNode;
  /** Validate on blur (default: true if in Form context) */
  validateOnBlur?: boolean;
  /** Validate on change (default: false) */
  validateOnChange?: boolean;
}

/**
 * Extract correct value from input based on type;
 */
function extractInputValue(target: HTMLInputElement): string | number | boolean | undefined {
  if (target.type === 'checkbox') {
    return target.checked;
  }
  
  if (target.type === 'radio') {
    return target.checked ? target.value : undefined;
  }
  
  if (target.type === 'number') {
    const num = target.valueAsNumber;
    // Return undefined for empty/invalid numbers (allows clearing field)
    return Number.isNaN(num) ? undefined : num;
  }
  
  return target.value;
}

/**
 * FormField - Wraps input with label, error, and helper text;
 * Automatically gets errors from Form context when used inside Form;
 * 
 * @example;
 * ```tsx;
 * // Inside Form - auto error handling;
 * <Form schema={schema} data={data} onSubmit={handler}>
 *   <FormField name="email" label="Email" type="email" />
 * </Form>
 * 
 * // Standalone - manual error handling;
 * <FormField;
 *   name="email"
 *   label="Email"
 *   error={errors['email']}
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export function FormField({
  name,
  label,
  error: propError,
  helperText,
  children,
  validateOnBlur = true,
  validateOnChange = false,
  onChange,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const formContext = useFormContext()

  // Use prop error if provided, otherwise get from context;
  const error = propError ?? formContext?.errors[name]
  
  // Get form state from context;
  const isSubmitting = formContext?.isSubmitting ?? false;
  // Handle blur validation with proper value extraction;
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e)

    if (validateOnBlur && formContext?.validateField) {
      const value = extractInputValue(e.target)
      formContext.validateField(name, value)
    }
  }, [onBlur, validateOnBlur, formContext, name])

  // Handle change validation with proper value extraction;
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)

    if (validateOnChange && formContext?.validateField) {
      const value = extractInputValue(e.target)
      formContext.validateField(name, value)
    }
  }, [onChange, validateOnChange, formContext, name])

  // Custom children render (with error display)
  if (children) {
    return (
      <div className="">
        <div className="">
          <label htmlFor={name} className="">
            {label}
            {inputProps.required && <span className="">*</span>}
          </label>
          {children}
        </div>
        
        {helperText && !error && (
          <p className="">{helperText}</p>
        )}
        
        {error && (
          <p className="" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Default Input render (Input handles its own error/helper display)
  return (
    <div className="">
      <Input
        id={name}
        name={name}
        label={label}
        error={error}
        helperText={helperText}
        disabled={isSubmitting || inputProps.disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        {...inputProps}
      />
    </div>
  )
}
