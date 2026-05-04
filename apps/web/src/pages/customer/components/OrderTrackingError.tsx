/**
 * Order Tracking Error Component
 * 
 * Extracted error state for order tracking page.
 */

import React from 'react'
import { Button } from '@shared/ui/primitives'
import { PageContainer } from '@shared/ui/layout/PageLayout'

interface OrderTrackingErrorProps {
  onBackToOrders: () => void
}

export function OrderTrackingError({ onBackToOrders }: OrderTrackingErrorProps) {
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-xl font-bold mb-3">Order not found</h2>
      <Button variant="primary" onClick={onBackToOrders}>Back to Orders</Button>
    </PageContainer>
  )
}
