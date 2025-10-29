/**
 * OrderCard - Specialized card component for orders
 * 
 * Built on top of BaseCard with order-specific logic and styling.
 * Handles order status, payment info, delivery method, and tracking actions.
 */

import React, { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Truck, Radio, CreditCard, Clock } from 'lucide-react'
import { BaseCard, type BaseCardProps } from '@shared/ui/primitives/BaseCard'
import { formatCurrency, formatRelativeTime, formatDate } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import type { OrderResponse, UpdateOrderRequestStatusEnum } from '@api/types'

// ========================================
// Order Card Props
// ========================================

export interface OrderCardProps extends Omit<BaseCardProps, 'title' | 'description'> {
  order: OrderResponse
  showPaymentStatus?: boolean
  showDeliveryMethod?: boolean
  showTracking?: boolean
  onStatusUpdate?: (orderId: string, status: UpdateOrderRequestStatusEnum) => void
}

// ========================================
// Order Status Configuration
// ========================================

const statusConfig: Record<string, { 
  variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info'
  icon: typeof Package
  label: string
}> = {
  PENDING: { variant: 'secondary', icon: Package, label: 'Order Placed' },
  CONFIRMED: { variant: 'info', icon: Package, label: 'Accepted' },
  PREPARING: { variant: 'warning', icon: Package, label: 'Preparing' },
  READY: { variant: 'warning', icon: Truck, label: 'Ready for Pickup' },
  COMPLETED: { variant: 'success', icon: Package, label: 'Completed' },
  CANCELLED: { variant: 'destructive', icon: Package, label: 'Canceled' },
}

const deliveryIcons = {
  PICKUP: Package,
  DELIVERY: Truck,
}

// ========================================
// Order Card Component
// ========================================

function OrderCardComponent({
  order,
  showPaymentStatus = true,
  showDeliveryMethod = true,
  showTracking = true,
  onStatusUpdate,
  onClick,
  actions = [],
  badges = [],
  meta = [],
  ...props
}: OrderCardProps) {
  
  const navigate = useNavigate()
  
  // ========================================
  // Memoized Computed Values
// ========================================
  
  const orderTitle = useMemo(() => 
    `Order #${order.id.slice(0, 8).toUpperCase()}`, 
    [order.id]
  )
  
  const orderSubtitle = useMemo(() => {
    const time = order.createdAt ? formatRelativeTime(order.createdAt) : 'Unknown time'
    const date = order.createdAt ? formatDate(order.createdAt) : 'Unknown date'
    return `${time} • ${date}`
  }, [order.createdAt])
  
  const total = useMemo(() => 
    parsePrice(order.total), 
    [order.total]
  )
  
  const tip = useMemo(() => 
    order.tip ? parsePrice(order.tip) : 0, 
    [order.tip]
  )
  
  const statusInfo = useMemo(() => 
    statusConfig[order.status] || { variant: 'secondary' as const, icon: Package, label: order.status }, 
    [order.status]
  )
  
  const isActive = useMemo(() => 
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status), 
    [order.status]
  )
  
  const orderBadges = useMemo(() => {
    const newBadges = [...badges]
    
    newBadges.push({
      label: statusInfo.label,
      variant: statusInfo.variant
    })
    
    return newBadges
  }, [badges, statusInfo])
  
  const orderMeta = useMemo(() => {
    const newMeta = [...meta]
    
    newMeta.push({
      label: 'Total',
      value: formatCurrency(total),
      className: 'font-semibold text-primary'
    })
    
    if (tip > 0) {
      newMeta.push({
        label: 'Includes tip',
        value: formatCurrency(tip)
      })
    }
    
    if (showDeliveryMethod) {
      const DeliveryIcon = deliveryIcons[order.deliveryType as keyof typeof deliveryIcons] || Package
      newMeta.push({
        icon: DeliveryIcon,
        label: 'Method',
        value: order.deliveryType
      })
    }
    
    if (showPaymentStatus) {
      newMeta.push({
        icon: CreditCard,
        label: 'Payment',
        value: order.paymentStatus,
        className: order.paymentStatus === 'PAID' ? 'text-success' : 'text-warning'
      })
    }
    
    return newMeta
  }, [
    meta, 
    total, 
    tip, 
    showDeliveryMethod, 
    order.deliveryType, 
    showPaymentStatus, 
    order.paymentStatus
  ])
  
  const orderActions = useMemo(() => {
    const newActions = [...actions]
    
    if (showTracking && isActive) {
      newActions.push({
        label: 'Track Live',
        variant: 'primary' as const,
        icon: Radio,
        onClick: () => navigate(`/orders/${order.id}`)
      })
    }
    
    return newActions
  }, [actions, showTracking, isActive, order.id, navigate])
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <BaseCard
      title={orderTitle}
      subtitle={orderSubtitle}
      badges={orderBadges}
      meta={orderMeta}
      actions={orderActions}
      onClick={onClick}
      {...props}
    />
  )
}

// ========================================
// Exports
// ========================================

export const OrderCard = memo(OrderCardComponent)
export type { OrderCardProps }
