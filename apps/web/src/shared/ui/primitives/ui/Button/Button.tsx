import { forwardRef } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { Loader2 } from 'lucide-react'

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      link: 'text-primary underline-offset-4 hover:underline'},
    size: {
      small: 'h-9 px-3 text-sm',
      medium: 'h-10 px-4 py-2 text-base',
      large: 'h-11 px-8 text-lg',
      icon: 'h-10 w-10 flex items-center justify-center'},
    fullWidth: {
      true: 'w-full'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'medium'
  }
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, className })}
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={isLoading ? 'Loading' : props['aria-label']}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

