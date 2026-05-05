import { Button } from '@shared/ui/primitives'

interface StateBlockProps {
  readonly title: string
  readonly message: string
  readonly actionLabel?: string
  readonly onAction?: () => void
  readonly className?: string
}

export function StateBlock({
  title,
  message,
  actionLabel,
  onAction,
  className,
}: StateBlockProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 text-center ${className ?? ''}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}
