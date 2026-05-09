/**
 * Order Tracking Hook
 * 
 * Extracts state management and business logic for order tracking.
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '@api/client'
import { authFetch } from '@shared/lib/auth/authFetch'
import { useCustomerRealtimeOrder } from '@shared/hooks/hooks/useCustomerRealtimeOrder'
import { useTip } from '@shared/hooks/hooks/useTip'
import { useStore } from '@shared/hooks/generated'
import { parseOrderData, parseOrderItems, getOrderStatusInfo, getOrderTimeInfo, getOrderProgress } from '../utils/orderTrackingUtils'
import type { ParsedOrder } from '../utils/orderTrackingUtils'
import { mapOrder } from '@api/type-mappers'

export interface UseOrderTrackingProps {
  onTipSuccess?: () => void
  onTipError?: (error: string) => void
}

export function useOrderTracking({ onTipSuccess, onTipError }: UseOrderTrackingProps = {}) {
  // ========================================
  // Router State
  // ========================================
  
  const { orderId: orderIdParam, id } = useParams<{ orderId?: string; id?: string }>()
  const orderId = orderIdParam ?? id
  const navigate = useNavigate()
  
  // ========================================
  // Local State
  // ========================================
  
  const [showTipPrompt, setShowTipPrompt] = useState(false)
  const [hasShownTipPrompt, setHasShownTipPrompt] = useState(false)
  
  // ========================================
  // API Hooks
  // ========================================
  
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const rawOrder = await apiClient.orders().getOrderById({ id: orderId! })
      return mapOrder(rawOrder)
    },
    enabled: !!orderId,
    refetchInterval: 5000,
  })

  const orderDeliveryType = (orderData as { deliveryType?: string } | undefined)?.deliveryType

  const deliveryPollMs = 15_000

  const { data: deliveryJob, refetch: refetchDeliveryJob } = useQuery({
    queryKey: ['delivery-tracking', orderId],
    queryFn: async () => {
      if (!orderId) return null

      const response = await authFetch(`delivery/tracking/${orderId}`)
      if (!response.ok) return null

      const data = (await response.json()) as { deliveryJob?: Record<string, unknown> | null }
      return data.deliveryJob ?? null
    },
    enabled: !!orderId && orderDeliveryType === 'DELIVERY',
    refetchInterval: deliveryPollMs,
    retry: 3,
  })
  
  const { createTip, isLoading: isTipLoading } = useTip()
  // Derive storeId without referencing parsed `order` (hooks must run before derived vars).
  const storeId = ((orderData as any)?.storeId ?? (orderData as any)?.data?.storeId ?? '') as string
  const storeQuery = useStore(storeId)
  
  // ========================================
  // Real-time Updates
  // ========================================
  
  useCustomerRealtimeOrder({
    orderId: orderId ?? '',
    enableToast: true,
  })
  
  // ========================================
  // Parsed Data
  // ========================================
  
  const order = parseOrderData(orderData)
  const store = storeQuery.data as { name?: string } | undefined
  const orderItems = orderData ? parseOrderItems((orderData as unknown as Record<string, unknown>).orderItems as string) : []
  
  // ========================================
  // Computed Values
  // ========================================
  
  const orderStatusInfo = order ? getOrderStatusInfo(order) : null
  const orderTimeInfo = order ? getOrderTimeInfo(order) : null
  const orderProgress = order ? getOrderProgress(order) : null
  
  // ========================================
  // Effects
  // ========================================
  
  useEffect(() => {
    if (order?.status === 'COMPLETED' && !hasShownTipPrompt) {
      const hasExistingTip = order.tip > 0
      if (!hasExistingTip) {
        setShowTipPrompt(true)
        setHasShownTipPrompt(true)
      }
    }
  }, [order?.status, order?.tip, hasShownTipPrompt])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleTipSubmit = useCallback(async (amount: number) => {
    try {
      if (!orderId) return
      
      const tip = await createTip({ orderId, amount })
      console.log('Tip created:', tip)
      setShowTipPrompt(false)
      
      // Show success feedback
      const successMessage = `Tip of $${amount.toFixed(2)} added successfully!`
      alert(successMessage)
      
      onTipSuccess?.()
    } catch (error) {
      console.error('Failed to add tip:', error)
      const errorMessage = 'Failed to add tip. Please try again.'
      alert(errorMessage)
      
      onTipError?.(errorMessage)
    }
  }, [orderId, createTip, onTipSuccess, onTipError])
  
  const handleTipClose = useCallback(() => {
    setShowTipPrompt(false)
  }, [])
  
  const handleBackToOrders = useCallback(() => {
    navigate('/orders')
  }, [navigate])
  
  // ========================================
  // Loading and Error States
  // ========================================
  
  const isLoadingOrder = isLoading
  const orderNotFound = !isLoading && !order
  const canShowTipPrompt = !orderNotFound && order && showTipPrompt
  
  return {
    // Data
    order,
    store,
    orderItems,
    deliveryJob,
    deliveryPollIntervalMs: deliveryPollMs,
    orderStatusInfo,
    orderTimeInfo,
    orderProgress,
    // State
    isLoadingOrder,
    orderNotFound,
    canShowTipPrompt,
    isTipLoading,
    // Actions
    handleTipSubmit,
    handleTipClose,
    handleBackToOrders,
    refetchDeliveryJob,
    // Navigation
    navigate
  }
}
