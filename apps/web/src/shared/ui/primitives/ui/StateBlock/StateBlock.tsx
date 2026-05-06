import { Button } from '@shared/ui/primitives'

interface StateBlockProps {
  readonly title: string
  readonly message: string
  readonly hint?: string
  readonly variant?: 'default' | 'destructive'
  readonly actionLabel?: string
  readonly onAction?: () => void
  readonly className?: string
}

export function StateBlock({
  title,
  message,
  hint,
  variant = 'default',
  actionLabel,
  onAction,
  className,
}: StateBlockProps) {
  const shell =
    variant === 'destructive'
      ? 'rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center'
      : 'rounded-xl border border-border bg-card p-6 text-center'

  return (
    <div className={`${shell} ${className ?? ''}`}>
      <h2 className={`text-lg font-semibold ${variant === 'destructive' ? 'text-destructive' : ''}`}>{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {hint ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground/90 break-all">{hint}</p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}
