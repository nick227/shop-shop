import { forwardRef } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const textAreaVariants = tv({
  base: 'flex w-full rounded-md border transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
  variants: {
    size: {
      sm: 'min-h-[60px] px-3 py-1 text-sm',
      md: 'min-h-[80px] px-4 py-2 text-base',
      lg: 'min-h-[120px] px-5 py-3 text-lg'},
    variant: {
      default: 'border-input bg-background',
      filled: 'border-transparent bg-muted'}},
  defaultVariants: {
    size: 'md',
    variant: 'default'}})

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textAreaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, size, variant, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          className={textAreaVariants({
            size,
            variant,
            className: error ? 'border-destructive focus-visible:ring-destructive' : className})}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

