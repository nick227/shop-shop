/**
 * Order Tracking Error Component
 * 
 * Extracted error state for order tracking page.
 */

import React from 'react'
import { Button } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'

interface OrderTrackingErrorProps {
  onBackToOrders: () => void
}

export function OrderTrackingError({ onBackToOrders }: OrderTrackingErrorProps) {
  return (
    <PageShell nested className="bg-background" containerClassName="max-w-3xl" contentClassName="py-6 md:py-6">
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center">
        <h2 className="mb-3 text-xl font-bold">Order not found</h2>
        <Button variant="primary" onClick={onBackToOrders}>Back to Orders</Button>
      </div>
    </PageShell>
  )
}
