import { forwardRef, useId } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const inputVariants = tv({
  base: 'flex w-full rounded-md border transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    size: {
      sm: 'h-9 px-3 py-1 text-sm',
      md: 'h-10 px-4 py-2 text-base',
      lg: 'h-12 px-5 py-3 text-lg',
    },
    variant: {
      default: 'border-input bg-background',
      filled: 'border-transparent bg-muted',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
})

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string | undefined
  error?: string | undefined
  helperText?: string | undefined
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, type, error, label, helperText, ...props }, ref) => {
    const generatedId = useId()
    const inputId = props.id ?? generatedId
    const helperId = helperText ? `${inputId}-help` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          aria-describedby={describedBy}
          className={inputVariants({
            size,
            variant,
            className: error ? 'border-destructive focus-visible:ring-destructive' : className,
          })}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="text-sm text-muted-foreground" id={helperId}>
            {helperText}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" id={errorId}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

