/**
 * useVendorRealtimeOrders - Real-time vendor order notifications
 * Subscribes to vendor's store and shows desktop notifications
 */

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRealtimeClient } from '@services/realtimeClient'
import { toast } from 'sonner'
import type { OrderCreatedEvent, OrderStatusChangedEvent } from '@packages/realtime'

export interface UseVendorRealtimeOrdersOptions {
  storeId?: string
  onNewOrder?: (event: OrderCreatedEvent) => void
  onOrderUpdate?: (event: OrderStatusChangedEvent) => void
  enableSound?: boolean
  enableDesktopNotification?: boolean
}

export function useVendorRealtimeOrders(options: UseVendorRealtimeOrdersOptions = {}) {
  const queryClient = useQueryClient()
  const {
    storeId,
    onNewOrder,
    onOrderUpdate,
    enableSound = true,
    enableDesktopNotification = true,
  } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Request notification permission on mount
  useEffect(() => {
    if (enableDesktopNotification && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('[Realtime] Desktop notifications enabled')
          }
        })
      }
  }, [enableDesktopNotification])

  // Play notification sound
  const playSound = useCallback(() => {
    if (!enableSound) return

    try {
      // Create audio element if not exists
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3')
        audioRef.current.volume = 0.5
      }

      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.warn('[Realtime] Could not play sound:', error)
      })
    } catch (error: any) {
      console.warn('[Realtime] Sound playback failed:', error)
    }
  }, [enableSound])

  // Show desktop notification
  const showDesktopNotification = useCallback((title: string, body: string, data?: Record<string, unknown>) => {
    if (!enableDesktopNotification || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: String(data?.orderId || 'order'),
        requireInteraction: true, // Keep notification visible
      })

      notification.addEventListener('click', () => {
        window.focus()
        // Navigate to orders page
        window.location.hash = '/vendor/orders'
        notification.close()
      })
    }
  }, [enableDesktopNotification])

  useEffect(() => {
    if (!storeId) return

    const realtimeClient = getRealtimeClient()

    // Connect to WebSocket
    realtimeClient.connect().catch(error => {
      console.error('[Realtime] Connection failed:', error)
    })

    // Subscribe to vendor events for this store
    const unsubscribe = realtimeClient.subscribeVendor(storeId, (event) => {
      console.log('[Realtime] Vendor event received:', event.type, event.payload)

      if (event.type === 'order.created') {
        const payload = event.payload as { orderId: string; storeId: string; customerId: string; customerName: string; total: number; deliveryType: string; status: string; itemCount: number }

        // Play sound
        playSound()

        // Show desktop notification
        showDesktopNotification(
          '🔔 New Order!',
          'Order #${payload.orderId.slice(0, 8).toUpperCase()} - ${payload.customerName} - $' + payload.total.toFixed(2) + '',
          { orderId: payload.orderId }
        )

        // Show toast
        toast.success('New order from ' + payload.customerName + '!')

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
        queryClient.invalidateQueries({ queryKey: ['vendor-pending-orders-count'] })

        // Call custom handler
        if (onNewOrder) {
          onNewOrder(event as OrderCreatedEvent)
        }
      }

      if (event.type === 'order.status.changed') {
        // Invalidate specific order and lists
        queryClient.invalidateQueries({ queryKey: ['order', event.payload.orderId] })
        queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
        queryClient.invalidateQueries({ queryKey: ['vendor-pending-orders-count'] })

        // Call custom handler
        if (onOrderUpdate) {
          onOrderUpdate(event as OrderStatusChangedEvent)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [storeId, queryClient, onNewOrder, onOrderUpdate, playSound, showDesktopNotification])

  return {
    isConnected: () => getRealtimeClient().isConnected(),
  }
}

