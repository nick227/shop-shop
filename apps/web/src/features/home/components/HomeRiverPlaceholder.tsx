/**
 * Phase 2 placeholder — social / River feed entry from home (not built yet).
 */
import React from 'react'
import { cn } from '@shared/lib/cn'

export interface HomeRiverPlaceholderProps {
  readonly className?: string
}

export function HomeRiverPlaceholder({ className }: HomeRiverPlaceholderProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-white/20 bg-white/10 p-4 text-center text-white/90',
        className
      )}
      aria-label="Community feed, coming in a later release"
    >
      <p className="text-sm font-medium">Community & updates</p>
      <p className="mt-1 text-xs text-white/70">
        Coming soon — follow stores and discover posts here (phase 2).
      </p>
    </section>
  )
}
