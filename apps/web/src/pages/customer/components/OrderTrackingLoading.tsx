/**
 * Order Tracking Loading Component
 * 
 * Extracted loading state for order tracking page.
 */

import React from 'react'
import { Spinner } from '@shared/ui/primitives'
import { PageContainer } from '@shared/ui/layout/PageLayout'

export function OrderTrackingLoading() {
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[60vh]">
      <Spinner size="large" />
      <p className="mt-4 text-muted-foreground text-sm">Loading order...</p>
    </PageContainer>
  )
}
