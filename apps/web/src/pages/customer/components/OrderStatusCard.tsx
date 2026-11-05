import { orderLabels } from '@features/orders/operations'
/**
 * Order Status Card Component
 * 
 * Extracted order status display with live progress tracking.
 */

import React from 'react'
import { Badge } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { OrderProgressTracker } from '@features/orders/components/OrderProgressTracker'
import type { ParsedOrder } from '../utils/orderTrackingUtils'

interface OrderStatusCardProps {
  order: ParsedOrder
  orderStatusInfo: {
    isCanceled: boolean
    isCompleted: boolean
    badgeVariant: string
  }
  orderTimeInfo: {
    orderAge: any
    estimatedReady: {
      display: string
      isLate: boolean
    }
  }
  orderProgress: {
    percentage: number
    statusMessage: string
  }
}

export function OrderStatusCard({
  order,
  orderStatusInfo,
  orderTimeInfo,
  orderProgress
}: OrderStatusCardProps) {
  const { isCanceled, isCompleted, badgeVariant } = orderStatusInfo
  const { orderAge, estimatedReady } = orderTimeInfo
  const { percentage, statusMessage } = orderProgress

  const allowedBadgeVariants = new Set([
    'default',
    'success',
    'secondary',
    'warning',
    'outline',
    'destructive',
  ])
  const safeBadgeVariant = (allowedBadgeVariants.has(badgeVariant) ? badgeVariant : 'default') as
    | 'default'
    | 'success'
    | 'secondary'
    | 'warning'
    | 'outline'
    | 'destructive'

  return (
    <Card>
      <CardContent className="pt-5 space-y-5">
        {/* Order Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <Badge variant={safeBadgeVariant}>
            {orderLabels[order.status] ?? order.status}
          </Badge>
        </div>

        <div className="rounded-xl bg-primary/5 p-5">
          <p className="text-sm text-muted-foreground">{order.status === 'READY' ? 'Your order is ready' : 'Vendor-confirmed ready time'}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{estimatedReady.display}</p>
          {estimatedReady.isLate && <p className="mt-2 text-sm text-destructive">Preparation is taking longer than promised. Contact the store for an update.</p>}
          <p className="mt-3 text-xs text-muted-foreground">Placed {orderAge.display}</p>
        </div>
        {order.deliveryType === 'PICKUP' && order.status === 'READY' && order.collectionCode && <div className="rounded-xl border border-primary/30 p-5"><p className="text-sm font-medium">Show this code when you collect your order</p><p className="mt-3 font-mono text-3xl font-semibold tracking-[0.25em]">{order.collectionCode}</p><p className="mt-2 text-sm text-muted-foreground">The store will confirm collection at handoff.</p></div>}
        {isCanceled && <p className="text-sm">{order.cancelReason || 'This order was canceled.'}</p>}
        {order.refundState && order.refundState !== 'NONE' && <div role="status" className="rounded-xl border border-border p-4"><p className="font-medium">{order.refundState === 'SUCCEEDED' ? 'Refund confirmed' : order.refundState === 'FAILED' ? 'Refund needs attention' : 'Refund in progress'}</p><p className="mt-1 text-sm text-muted-foreground">{order.refundState === 'SUCCEEDED' ? 'The payment provider has confirmed your refund.' : 'Your refund is still being resolved. Contact the store if you need help.'}</p></div>}
        {/* Progress Tracker */}
        <OrderProgressTracker currentStatus={order.status} isCanceled={isCanceled} deliveryType={order.deliveryType} />


      </CardContent>
    </Card>
  )
}
