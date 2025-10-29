import { forwardRef } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@shared/lib/cn'

const alertVariants = tv({
  base: 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  variants: {
    variant: {
      default: 'bg-background text-foreground border-border',
      info: 'border-blue-500/50 text-blue-600 dark:text-blue-400 [&>svg]:text-blue-600',
      success: 'border-success/50 bg-success/10 text-success dark:bg-success/10 [&>svg]:text-success',
      warning: 'border-warning/50 bg-warning/10 text-warning dark:bg-warning/10 [&>svg]:text-warning',
      error: 'border-destructive/50 bg-destructive/10 text-destructive [&>svg]:text-destructive'}},
  defaultVariants: {
    variant: 'default'}})

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onClose?: () => void;
  showIcon?: boolean;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, onClose, showIcon = true, ...props }, ref) => {
    const Icon = iconMap[variant || 'default']

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export const AlertTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

export const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

