/**
 * Order Tracking Utilities
 * 
 * Extracted utility functions for order tracking page.
 * Uses centralized order status configuration.
 */

import { getOrderStatusConfig, ORDER_STATUS_CONFIG } from '@features/orders/utils/orderUtils'

export interface OrderItem {
  id: string
  orderId: string
  itemId: string
  quantity: number
  titleSnapshot: string
  unitPrice: number
}

export interface ParsedOrder {
  id: string
  status: string
  deliveryType: string
  subtotal: number
  fees: number
  tax: number
  tip: number
  total: number
  createdAt: string
  addressSnapshot?: {
    line1: string
    line2: string | null
    city: string
    state: string
    postalCode: string
    country: string
  }
}

// ========================================
// Order Items Parser
// ========================================

export function parseOrderItems(orderItemsString: string | null | undefined): OrderItem[] {
  if (!orderItemsString) return []
  
  try {
    const parsed: unknown = JSON.parse(orderItemsString)
    return Array.isArray(parsed) ? parsed.map((item: unknown, index: number) => {
      const orderItem = item as Record<string, unknown>
      return {
        id: (orderItem.id as string) ?? `item-${index}`,
        orderId: (orderItem.orderId as string) ?? '',
        itemId: (orderItem.itemId as string) ?? (orderItem.id as string) ?? `item-${index}`,
        quantity: (orderItem.quantity as number) ?? 1,
        titleSnapshot: (orderItem.titleSnapshot as string) ?? (orderItem.title as string) ?? 'Unknown Item',
        unitPrice: (orderItem.unitPrice as number) ?? (orderItem.price as number) ?? 0,
      }
    }) : []
  } catch (error) {
    console.warn('Failed to parse order items:', error)
    return []
  }
}

// ========================================
// Order Data Parser
// ========================================

export function parseOrderData(orderData: any): ParsedOrder | undefined {
  if (!orderData) return undefined
  
  return {
    ...orderData,
    status: orderData.status as string,
    deliveryType: orderData.deliveryType,
    subtotal: Number.parseFloat(orderData.subtotal),
    fees: Number.parseFloat(orderData.fees),
    tax: Number.parseFloat(orderData.tax),
    tip: Number.parseFloat(orderData.tip),
    total: Number.parseFloat(orderData.total),
    addressSnapshot: orderData.addressSnapshot ? {
      line1: orderData.addressSnapshot.line1 as string,
      line2: orderData.addressSnapshot.line2 as string | null,
      city: orderData.addressSnapshot.city as string,
      state: orderData.addressSnapshot.state as string,
      postalCode: orderData.addressSnapshot.postalCode as string,
      country: orderData.addressSnapshot.country as string,
    } : undefined,
  }
}

// ========================================
// Order Status Utilities
// ========================================

export function getOrderStatusInfo(order: ParsedOrder) {
  const statusConfig = getOrderStatusConfig(order.status)
  const isCanceled = order.status === 'CANCELED'
  const isCompleted = order.status === 'COMPLETED'
  
  return {
    isCanceled,
    isCompleted,
    badgeVariant: statusConfig.variant,
    statusLabel: statusConfig.label,
    canTransitionTo: statusConfig.canTransitionTo,
    actionLabel: statusConfig.actionLabel,
    actionIcon: statusConfig.actionIcon
  }
}

// ========================================
// Time Utilities
// ========================================

export function getOrderTimeInfo(order: ParsedOrder) {
  const { getOrderAge, getEstimatedReadyTime } = require('@shared/lib/utils/orderHelpers')
  
  const orderAge = getOrderAge(order.createdAt)
  const estimatedReadyDate = getEstimatedReadyTime(order.createdAt, 20)
  const estimatedReady = {
    display: estimatedReadyDate.toLocaleTimeString(),
    isLate: estimatedReadyDate < new Date()
  }
  
  return {
    orderAge,
    estimatedReady
  }
}

// ========================================
// Progress Utilities
// ========================================

export function getOrderProgress(order: ParsedOrder) {
  // Use centralized status config for progress calculation
  const statusConfig = getOrderStatusConfig(order.status)
  const statusProgressMap: Record<string, number> = {
    'PLACED': 10,
    'ACCEPTED': 25,
    'PREPARING': 50,
    'READY': 75,
    'OUT_FOR_DELIVERY': 90,
    'COMPLETED': 100,
    'CANCELED': 0
  }
  
  const percentage = statusProgressMap[order.status] || 0
  const statusMessage = statusConfig.label || `Order ${order.status.toLowerCase()}`
  
  return {
    percentage,
    statusMessage,
    statusConfig
  }
}
