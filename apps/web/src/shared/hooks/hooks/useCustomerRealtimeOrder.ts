/**
 * useCustomerRealtimeOrder - Real-time order status updates for customers
 * Subscribes to customer's orders and shows live status changes
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRealtimeClient } from '@services/realtimeClient'
import { toast } from 'sonner'
import type { OrderStatusChangedEvent } from '@packages/realtime'

export interface UseCustomerRealtimeOrderOptions {
  userId?: string
  orderId?: string
  onStatusChange?: (event: OrderStatusChangedEvent) => void
  enableToast?: boolean
}

const STATUS_MESSAGES: Record<string, string> = {
  PLACED: '📋 Order placed successfully!',
  ACCEPTED: '✅ Your order has been accepted!',
  PREPARING: '👨‍🍳 Your order is being prepared!',
  READY: '🎉 Your order is ready!',
  COMPLETED: '✅ Order completed! Enjoy your meal!',
  CANCELED: '❌ Your order was canceled',
}

export function useCustomerRealtimeOrder(options: UseCustomerRealtimeOrderOptions = {}) {
  const queryClient = useQueryClient()
  const {
    userId,
    orderId,
    onStatusChange,
    enableToast = true,
  } = options

  useEffect(() => {
    const realtimeClient = getRealtimeClient()

    // Connect to WebSocket
    realtimeClient.connect().catch(error => {
      console.error('[Customer Realtime] Connection failed:', error)
    })

    let unsubscribe: (() => void) | undefined

    // Subscribe to customer topic or specific order
    if (orderId) {
      // Subscribe to specific order
      unsubscribe = realtimeClient.subscribeOrder(orderId, (event) => {
        console.log('[Customer Realtime] Order event:', event.type, event.payload)

        if (event.type === 'order.status.changed') {
          const typedEvent = event as OrderStatusChangedEvent
          const payload = typedEvent.payload

          // Show toast notification
          if (enableToast) {
            const message = STATUS_MESSAGES[payload.newStatus] || 'Order status: ' + payload.newStatus + ''
            
            if (payload.newStatus === 'READY') {
              toast.success(message)
            } else if (payload.newStatus === 'CANCELED') {
              toast.error(message)
            } else {
              toast.info(message)
            }
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['order', orderId] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })

          // Call custom handler
          if (onStatusChange) {
            onStatusChange(event as OrderStatusChangedEvent)
          }
        }
      })
    } else if (userId) {
      // Subscribe to all customer's orders
      unsubscribe = realtimeClient.subscribeCustomer(userId, (event) => {
        console.log('[Customer Realtime] Customer event:', event.type, event.payload)

        if (event.type === 'order.status.changed') {
          const typedEvent = event as OrderStatusChangedEvent
          const payload = typedEvent.payload

          // Show toast
          if (enableToast) {
            const message = STATUS_MESSAGES[payload.newStatus] || 'Order updated: ' + payload.newStatus + ''
            toast.info(message)
          }

          // Refresh queries
          queryClient.invalidateQueries({ queryKey: ['order', payload.orderId] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })

          // Call handler
          if (onStatusChange) {
            onStatusChange(event as OrderStatusChangedEvent)
          }
        }
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, orderId, queryClient, onStatusChange, enableToast])

  return {
    isConnected: () => getRealtimeClient().isConnected(),
  }
}

