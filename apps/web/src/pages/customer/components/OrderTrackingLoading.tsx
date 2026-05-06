/**
 * Order Tracking Loading Component
 * 
 * Extracted loading state for order tracking page.
 */

import React from 'react'
import { Spinner } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'

export function OrderTrackingLoading() {
  return (
    <PageShell nested className="bg-background" containerClassName="max-w-3xl" contentClassName="py-6 md:py-6">
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-border bg-card p-4">
        <Spinner size="large" />
        <p className="mt-4 text-muted-foreground text-sm">Loading order...</p>
      </div>
    </PageShell>
  )
}
