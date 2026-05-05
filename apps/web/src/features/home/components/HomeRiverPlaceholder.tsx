/**
 * Phase 2 — minimal footer hint only (no large section).
 */
import React from 'react'
import { cn } from '@shared/lib/cn'

export interface HomeRiverPlaceholderProps {
  readonly className?: string
}

export function HomeRiverPlaceholder({ className }: HomeRiverPlaceholderProps) {
  return (
    <p
      className={cn('mt-8 text-center text-xs text-white/45', className)}
      aria-label="Personalized feed coming later"
    >
      Personalized feed coming soon
    </p>
  )
}
