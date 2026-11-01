/**
 * StatusPill — one shape for store and order states, one color per meaning.
 */
import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export type StatusTone = 'live' | 'warning' | 'danger' | 'neutral'

const TONE_CLASS: Record<StatusTone, string> = {
  live: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

const DOT_CLASS: Record<StatusTone, string> = {
  live: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  neutral: 'bg-muted-foreground/60',
}

interface StatusPillProps {
  readonly tone: StatusTone
  readonly children: ReactNode
  /** Dot only, for tight spaces such as a collapsed rail. */
  readonly bare?: boolean
  readonly className?: string
}

export function StatusPill({ tone, children, bare = false, className }: StatusPillProps) {
  if (bare) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[tone])} aria-hidden />
        {children}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[tone])} aria-hidden />
      {children}
    </span>
  )
}
