/**
 * OrderStatusBadge - Centralized order status rendering
 * Consolidates status display logic from VendorOrdersPage, OrderCard, OrderTrackingPage
 * Config-driven for easy maintenance and extension
 */
import { Badge } from '@shared/ui/primitives'
import type { UpdateOrderRequestStatusEnum } from '@api/types'

export type OrderStatus = UpdateOrderRequestStatusEnum

interface StatusConfig {
  icon: string
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

const ORDER_STATUS_CONFIG: Partial<Record<OrderStatus, StatusConfig>> = {
  PENDING_PAYMENT: { icon: '💳', label: 'Pending Payment', variant: 'secondary' },
  PLACED: { icon: '🔔', label: 'New Order', variant: 'warning' },
  ACCEPTED: { icon: '✅', label: 'Accepted', variant: 'secondary' },
  PREPARING: { icon: '👨‍🍳', label: 'Preparing', variant: 'default' },
  READY: { icon: '🎉', label: 'Ready', variant: 'success' },
  OUT_FOR_DELIVERY: { icon: '🚗', label: 'Out for Delivery', variant: 'default' },
  DELIVERED: { icon: '✅', label: 'Done', variant: 'default' },
  COMPLETED: { icon: '✅', label: 'Completed', variant: 'success' },
  CANCELED: { icon: '❌', label: 'Canceled', variant: 'destructive' },
}

export interface OrderStatusBadgeProps {
  status: OrderStatus
  /** Show icon (default: true) */
  showIcon?: boolean
  /** Override label */
  customLabel?: string
}

export function OrderStatusBadge({ 
  status, 
  showIcon = true,
  customLabel 
}: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status]
  
  if (!config) {
    // Fallback for unknown statuses
    return <Badge variant="default">{status}</Badge>
  }
  
  const label = customLabel || config.label
  const displayText = showIcon ? `${config.icon} ${label}` : label
  
  return <Badge variant={config.variant}>{displayText}</Badge>
}

/**
 * Get status configuration for programmatic access
 */
export function getStatusConfig(status: OrderStatus): StatusConfig | undefined {
  return ORDER_STATUS_CONFIG[status]
}

/**
 * Check if order is in pending state (needs vendor attention)
 */
export function isOrderPending(status: OrderStatus): boolean {
  return ['PLACED', 'ACCEPTED', 'PREPARING'].includes(status)
}

/**
 * Check if order is in active state (customer waiting)
 */
export function isOrderActive(status: OrderStatus): boolean {
  return ['PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(status)
}

/**
 * Get status progression for tracking
 */
export const ORDER_STATUS_PROGRESSION: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

/**
 * Get next status in progression
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | undefined {
  const currentIndex = ORDER_STATUS_PROGRESSION.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex === ORDER_STATUS_PROGRESSION.length - 1) {
    return undefined
  }
  return ORDER_STATUS_PROGRESSION[currentIndex + 1] || undefined
}

