import { forwardRef } from 'react'
import { cn } from '@shared/lib/cn'

type CardProps = React.HTMLAttributes<HTMLElement>

const Card = forwardRef<HTMLElement, CardProps>(({ className, onClick, ...props }, ref) => {
  const baseClassName = cn(
    'rounded-xl bg-card text-card-foreground',
    onClick ? 'clickable cursor-pointer' : undefined,
    className,
  )

  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={baseClassName}
        onClick={onClick}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    )
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={baseClassName}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    />
  )
})
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 p-2', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold tracking-tight leading-none', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-5 pb-5', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-5 pb-5', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
