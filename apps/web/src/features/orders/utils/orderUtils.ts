/**
 * Order Status Mapping Utilities
 * 
 * Provides centralized order status management and validation logic.
 */

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED'

export interface OrderStatusConfig {
  variant: 'warning' | 'secondary' | 'default' | 'success' | 'destructive'
  label: string
  canTransitionTo: OrderStatus[]
  actionLabel?: string
  actionIcon?: string
}

// ========================================
// Order Status Configuration
// ========================================

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  PLACED: {
    variant: 'warning',
    label: 'Placed',
    canTransitionTo: ['ACCEPTED', 'CANCELLED'],
    actionLabel: 'Accept',
    actionIcon: '✅'
  },
  ACCEPTED: {
    variant: 'secondary',
    label: 'Accepted',
    canTransitionTo: ['PREPARING', 'CANCELLED'],
    actionLabel: 'Start Preparing',
    actionIcon: '👨‍🍳'
  },
  PREPARING: {
    variant: 'default',
    label: 'Preparing',
    canTransitionTo: ['READY'],
    actionLabel: 'Mark Ready',
    actionIcon: '🎉'
  },
  READY: {
    variant: 'success',
    label: 'Ready',
    canTransitionTo: ['OUT_FOR_DELIVERY', 'COMPLETED'],
    actionLabel: 'Out for Delivery',
    actionIcon: '🚗'
  },
  OUT_FOR_DELIVERY: {
    variant: 'success',
    label: 'Out for Delivery',
    canTransitionTo: ['COMPLETED'],
    actionLabel: 'Delivered',
    actionIcon: '✅'
  },
  COMPLETED: {
    variant: 'default',
    label: 'Completed',
    canTransitionTo: [],
    actionLabel: undefined,
    actionIcon: undefined
  },
  CANCELLED: {
    variant: 'destructive',
    label: 'Cancelled',
    canTransitionTo: [],
    actionLabel: undefined,
    actionIcon: undefined
  }
}

// ========================================
// Status Mapping Functions
// ========================================

/**
 * Get status configuration for an order
 */
export function getOrderStatusConfig(status: string): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status as OrderStatus] || ORDER_STATUS_CONFIG.PLACED
}

/**
 * Get badge variant for order status
 */
export function getStatusBadgeVariant(status: string): OrderStatusConfig['variant'] {
  return getOrderStatusConfig(status).variant
}

/**
 * Get action button configuration for current status
 */
export function getActionButtonConfig(status: string, isDelivery: boolean) {
  const config = getOrderStatusConfig(status)
  
  if (!config.actionLabel) return null
  
  let actionLabel = config.actionLabel
  let nextStatus = config.canTransitionTo[0] // Take first available transition
  
  // Special handling for READY status based on delivery type
  if (status === 'READY') {
    actionLabel = isDelivery ? '🚗 Out' : '✅ Delivered'
    nextStatus = isDelivery ? 'OUT_FOR_DELIVERY' : 'COMPLETED'
  }
  
  return {
    label: actionLabel,
    nextStatus,
    icon: config.actionIcon
  }
}

/**
 * Check if order is in active state (has available actions)
 */
export function isOrderActive(status: string): boolean {
  const config = getOrderStatusConfig(status)
  return config.canTransitionTo.length > 0
}

/**
 * Check if order is urgent (older than 15 minutes and in early stages)
 */
export function isOrderUrgent(orderAge: { minutes: number }, status: string): boolean {
  return orderAge.minutes > 15 && ['PLACED', 'ACCEPTED'].includes(status)
}

/**
 * Parse order items safely
 */
export function parseOrderItems(items: any): any[] {
  try {
    return typeof items === 'string' ? JSON.parse(items) : items || []
  } catch {
    return []
  }
}

/**
 * Get display items (first 2 items) and count of remaining items
 */
export function getOrderItemsDisplay(items: any[]) {
  const displayItems = items.slice(0, 2)
  const remainingCount = Math.max(0, items.length - 2)
  
  return {
    displayItems,
    remainingCount,
    hasMore: remainingCount > 0
  }
}
