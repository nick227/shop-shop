/**
 * Hero — home uses `compact` for funnel-first layout.
 */
import React from 'react'
import { cn } from '@shared/lib/cn'

export interface HeroSectionProps {
  readonly headline: string
  readonly subheadline: string
  readonly variant?: 'default' | 'compact'
}

export function HeroSection({ headline, subheadline, variant = 'default' }: HeroSectionProps) {
  const compact = variant === 'compact'
  return (
    <section
      className={cn(
        'px-2 text-center text-white',
        compact ? 'py-4' : 'py-12 px-4'
      )}
    >
      <h1
        className={cn(
          'font-extrabold drop-shadow-md',
          compact ? 'text-2xl md:text-3xl' : 'mb-4 text-5xl md:text-3xl'
        )}
      >
        {headline}
      </h1>
      <p
        className={cn(
          'font-light opacity-95',
          compact ? 'mt-1 text-sm md:text-base' : 'text-xl md:text-base'
        )}
      >
        {subheadline}
      </p>
    </section>
  )
}

