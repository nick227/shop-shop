/**
 * Vendor Order Card Hook
 * 
 * Extracts state management and computed values for VendorOrderCard.
 */

import { useMemo } from 'react'
import { getOrderAge } from '@shared/lib/utils/orderHelpers'
import { isOrderUrgent } from '../../../utils/orderUtils'
import type { OrderResponse } from '@api/types'

export interface UseVendorOrderCardProps {
  order: OrderResponse
  isSelected: boolean
  isBulkMode?: boolean
  isBulkSelected?: boolean
}

export function useVendorOrderCard({
  order,
  isSelected,
  isBulkMode = false,
  isBulkSelected = false
}: UseVendorOrderCardProps) {
  // ========================================
  // Computed Values
  // ========================================
  
  const orderAge = useMemo(() => {
    return getOrderAge(order.createdAt || new Date().toISOString())
  }, [order.createdAt])
  
  const isUrgent = useMemo(() => {
    return isOrderUrgent(orderAge, order.status)
  }, [orderAge, order.status])
  
  const isDelivery = useMemo(() => {
    return order.deliveryType === 'DELIVERY'
  }, [order.deliveryType])
  
  const orderId = useMemo(() => {
    return `#${order.id.slice(0, 8).toUpperCase()}`
  }, [order.id])
  
  // ========================================
  // Card Styling
  // ========================================
  
  const cardClasses = useMemo(() => {
    const baseClasses = 'cursor-pointer rounded-xl border bg-card p-4 transition-all duration-200'
    
    const selectionClasses = isBulkMode && isBulkSelected 
      ? 'border-primary shadow-lg ring-2 ring-primary/20'
      : (isSelected 
        ? 'border-primary shadow-lg ring-2 ring-primary/20'
        : 'border-border hover:border-primary/40 hover:shadow-md')
    
    const urgencyClasses = isUrgent ? ' border-l-4 border-l-destructive bg-destructive/5' : ''
    
    return `${baseClasses} ${selectionClasses} ${urgencyClasses}`
  }, [isSelected, isBulkMode, isBulkSelected, isUrgent])
  
  return {
    orderAge,
    isUrgent,
    isDelivery,
    orderId,
    cardClasses
  }
}
