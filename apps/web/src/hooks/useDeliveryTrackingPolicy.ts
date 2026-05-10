import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRealtimeClient } from '@services/realtimeClient'

export type DeliveryTrackingSurface = 'customer-tracking' | 'vendor-order-detail' | 'admin-delivery'

export interface DeliveryTrackingLocation {
  latitude?: number
  longitude?: number
  address?: unknown
}

export interface DeliveryTrackingRealtimeEvent {
  type: 'delivery.status.updated' | 'delivery.location.updated' | string
  topic?: string
  timestamp: string
  payload: {
    deliveryJobId?: string
    orderId?: string
    userId?: string
    storeId?: string
    previousStatus?: string
    newStatus?: string
    providerStatus?: string
    provider?: string
    location?: DeliveryTrackingLocation
    source?: string
  }
}

interface UseDeliveryTrackingPolicyOptions {
  surface: DeliveryTrackingSurface
  orderId?: string
  userId?: string
  storeId?: string
  terminal?: boolean
  serverNextPollMs?: number | null
  liveMode?: boolean
  enabled?: boolean
}

interface DeliveryTrackingPolicy {
  isVisible: boolean
  shouldUseRealtime: boolean
  isRealtimeConnected: boolean
  pollIntervalMs: number | false
  lastEvent: DeliveryTrackingRealtimeEvent | null
}

const DEFAULT_CUSTOMER_POLL_MS = 15_000
const DEFAULT_VENDOR_POLL_MS = 30_000
const DEFAULT_ADMIN_LIVE_POLL_MS = 30_000
const HIDDEN_POLL_MS = 60_000

function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true
    return document.visibilityState === 'visible'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return isVisible
}

function getFallbackPollMs(
  surface: DeliveryTrackingSurface,
  serverNextPollMs?: number | null,
): number {
  if (typeof serverNextPollMs === 'number' && serverNextPollMs > 0) {
    return serverNextPollMs
  }

  if (surface === 'vendor-order-detail') return DEFAULT_VENDOR_POLL_MS
  if (surface === 'admin-delivery') return DEFAULT_ADMIN_LIVE_POLL_MS
  return DEFAULT_CUSTOMER_POLL_MS
}

export function useDeliveryTrackingPolicy({
  surface,
  orderId,
  userId,
  storeId,
  terminal = false,
  serverNextPollMs,
  liveMode = false,
  enabled = true,
}: UseDeliveryTrackingPolicyOptions): DeliveryTrackingPolicy {
  const queryClient = useQueryClient()
  const isVisible = usePageVisibility()
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<DeliveryTrackingRealtimeEvent | null>(null)

  const shouldUseRealtime = useMemo(() => {
    if (!enabled || terminal || !isVisible) return false
    if (surface === 'admin-delivery') return liveMode
    return Boolean(orderId)
  }, [enabled, isVisible, liveMode, orderId, surface, terminal])

  useEffect(() => {
    if (!shouldUseRealtime) {
      setIsRealtimeConnected(false)
      return
    }

    const realtimeClient = getRealtimeClient()
    let unsubscribeOrder: (() => void) | undefined
    let unsubscribeCustomer: (() => void) | undefined
    let unsubscribeVendor: (() => void) | undefined
    let unsubscribeConnected: (() => void) | undefined
    let unsubscribeDisconnected: (() => void) | undefined
    let cancelled = false

    const handleEvent = (rawEvent: unknown) => {
      const event = rawEvent as DeliveryTrackingRealtimeEvent
      const payloadOrderId = event.payload?.orderId
      if (orderId && payloadOrderId && payloadOrderId !== orderId) return

      setLastEvent(event)

      if (payloadOrderId) {
        queryClient.invalidateQueries({ queryKey: ['delivery-tracking', payloadOrderId] })
        queryClient.invalidateQueries({ queryKey: ['order', payloadOrderId] })
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }

    unsubscribeConnected = realtimeClient.on('connected', () => setIsRealtimeConnected(true))
    unsubscribeDisconnected = realtimeClient.on('disconnected', () => setIsRealtimeConnected(false))

    realtimeClient.connect()
      .then(() => {
        if (cancelled) return
        setIsRealtimeConnected(realtimeClient.isConnected())
      })
      .catch((error) => {
        console.error('[Delivery Tracking Policy] Realtime connection failed:', error)
        setIsRealtimeConnected(false)
      })

    if (orderId) {
      unsubscribeOrder = realtimeClient.subscribeOrder(orderId, handleEvent)
    }

    if (surface === 'customer-tracking' && userId) {
      unsubscribeCustomer = realtimeClient.subscribeCustomer(userId, handleEvent)
    }

    if (surface === 'vendor-order-detail' && storeId) {
      unsubscribeVendor = realtimeClient.subscribeVendor(storeId, handleEvent)
    }

    return () => {
      cancelled = true
      unsubscribeOrder?.()
      unsubscribeCustomer?.()
      unsubscribeVendor?.()
      unsubscribeConnected?.()
      unsubscribeDisconnected?.()

      if (realtimeClient.getSubscriptions().length === 0) {
        realtimeClient.disconnect()
      }
      setIsRealtimeConnected(false)
    }
  }, [orderId, queryClient, shouldUseRealtime, storeId, surface, userId])

  const pollIntervalMs = useMemo(() => {
    if (!enabled || terminal) return false
    if (shouldUseRealtime && isRealtimeConnected) return false
    if (!isVisible) return surface === 'admin-delivery' && liveMode ? HIDDEN_POLL_MS : false
    if (surface === 'admin-delivery' && !liveMode) return false
    return getFallbackPollMs(surface, serverNextPollMs)
  }, [
    enabled,
    isRealtimeConnected,
    isVisible,
    liveMode,
    serverNextPollMs,
    shouldUseRealtime,
    surface,
    terminal,
  ])

  return {
    isVisible,
    shouldUseRealtime,
    isRealtimeConnected,
    pollIntervalMs,
    lastEvent,
  }
}
