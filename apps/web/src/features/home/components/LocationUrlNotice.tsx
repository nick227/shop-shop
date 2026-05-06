/**
 * Non-blocking notice for URL / deep-link location issues (not always “invalid URL”).
 */
import React from 'react'

export type UrlLocationNoticeVariant = 'info' | 'warning' | 'error'

export interface UrlLocationNoticePayload {
  readonly message: string
  readonly variant: UrlLocationNoticeVariant
}

interface LocationUrlNoticeProps {
  readonly notice: UrlLocationNoticePayload | undefined
  readonly onDismiss: () => void
}

const variantClasses: Record<UrlLocationNoticeVariant, string> = {
  info: 'border-primary/30 bg-primary/5 text-foreground',
  warning: 'border-amber-500/40 bg-amber-500/10 text-foreground',
  error: 'border-destructive/40 bg-destructive/10 text-foreground',
}

export function LocationUrlNotice({ notice, onDismiss }: LocationUrlNoticeProps) {
  if (!notice) return null
  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 ${variantClasses[notice.variant]}`}
      role="status"
      aria-live="polite"
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {notice.variant === 'error' ? '⚠️' : notice.variant === 'warning' ? 'ⓘ' : 'ℹ️'}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">
          {notice.variant === 'error'
            ? 'Location couldn’t be loaded'
            : notice.variant === 'warning'
              ? 'Heads up'
              : 'Notice'}
        </p>
        <p className="mt-1 text-muted-foreground">{notice.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 font-bold text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
