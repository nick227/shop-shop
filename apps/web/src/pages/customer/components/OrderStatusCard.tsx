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
            {order.status}
          </Badge>
        </div>

        {/* Time Information */}
        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
          <span>Placed {orderAge.display}</span>
          {!isCanceled && !isCompleted && (
            <span className="font-medium text-primary">Est. {estimatedReady.display}</span>
          )}
        </div>

        {/* Progress Tracker */}
        <OrderProgressTracker currentStatus={order.status} isCanceled={isCanceled} />

        {/* Live Status */}
        {!isCanceled && (
          <div className="pt-5 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md">Live</span>
              {estimatedReady.isLate && (
                <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-md">Running late</span>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground font-medium">{statusMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
