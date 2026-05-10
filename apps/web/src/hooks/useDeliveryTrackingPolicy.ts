import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRealtimeClient } from '@services/realtimeClient'

/**
 * Shared delivery realtime/polling policy for the shared-hosting MVP.
 *
 * Components provide context and intent:
 * - `surface`: customer tracking, vendor order detail, or admin delivery.
 * - `orderId` / `storeId`: the smallest useful realtime scope.
 * - `terminal`: true means no socket and no polling.
 * - `serverNextPollMs`: server-recommended fallback interval, clamped client-side.
 * - `liveMode`: admin-only opt-in for live updates.
 *
 * Components consume decisions and state:
 * - `shouldUseRealtime`: whether the hook is allowed to open/keep a socket.
 * - `isRealtimeConnected`: actual socket connection state.
 * - `pollIntervalMs`: bounded fallback interval, or false when polling is disabled.
 * - `lastEvent`: latest delivery realtime event seen by this policy scope.
 * - `markMeaningfulInteraction`: resets the admin idle timer after delivery-data actions.
 *
 * Admin idle is deliberately narrow. It should be reset by meaningful interactions with
 * delivery data, such as manual refresh, refreshing a delivery job, changing delivery
 * filters, or clicking/opening a delivery row. Pointer movement and page focus do not
 * count because they are noisy and hard to test.
 */
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

export interface UseDeliveryTrackingPolicyOptions {
  surface: DeliveryTrackingSurface
  orderId?: string
  storeId?: string
  terminal?: boolean
  serverNextPollMs?: number | null
  liveMode?: boolean
  enabled?: boolean
  invalidateQueryKeys?: unknown[][]
  adminIdleMs?: number
  onAdminIdle?: () => void
}

export interface DeliveryTrackingPolicy {
  isVisible: boolean
  shouldUseRealtime: boolean
  isRealtimeConnected: boolean
  pollIntervalMs: number | false
  lastEvent: DeliveryTrackingRealtimeEvent | null
  markMeaningfulInteraction: () => void
}

const DEFAULT_CUSTOMER_POLL_MS = 15_000
const DEFAULT_VENDOR_POLL_MS = 30_000
const DEFAULT_ADMIN_LIVE_POLL_MS = 30_000
const MIN_POLL_MS = 5_000
const MAX_POLL_MS = 60_000
const HIDDEN_POLL_MS = 60_000

function clampPollMs(value: number): number {
  return Math.min(Math.max(value, MIN_POLL_MS), MAX_POLL_MS)
}

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
    return clampPollMs(serverNextPollMs)
  }

  if (surface === 'vendor-order-detail') return clampPollMs(DEFAULT_VENDOR_POLL_MS)
  if (surface === 'admin-delivery') return clampPollMs(DEFAULT_ADMIN_LIVE_POLL_MS)
  return clampPollMs(DEFAULT_CUSTOMER_POLL_MS)
}

export function useDeliveryTrackingPolicy({
  surface,
  orderId,
  storeId,
  terminal = false,
  serverNextPollMs,
  liveMode = false,
  enabled = true,
  invalidateQueryKeys,
  adminIdleMs = 10 * 60 * 1000,
  onAdminIdle,
}: UseDeliveryTrackingPolicyOptions): DeliveryTrackingPolicy {
  const queryClient = useQueryClient()
  const isVisible = usePageVisibility()
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<DeliveryTrackingRealtimeEvent | null>(null)
  const [lastMeaningfulInteractionAt, setLastMeaningfulInteractionAt] = useState(() => Date.now())

  const markMeaningfulInteraction = useCallback(() => {
    setLastMeaningfulInteractionAt(Date.now())
  }, [])

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
    let unsubscribeVendor: (() => void) | undefined
    let unsubscribeAdmin: (() => void) | undefined
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
      for (const queryKey of invalidateQueryKeys ?? []) {
        queryClient.invalidateQueries({ queryKey })
      }
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

    if (surface === 'vendor-order-detail' && !orderId && storeId) {
      unsubscribeVendor = realtimeClient.subscribeVendor(storeId, handleEvent)
    }

    if (surface === 'admin-delivery') {
      unsubscribeAdmin = realtimeClient.subscribe('admin:delivery' as never, handleEvent as never)
    }

    return () => {
      cancelled = true
      unsubscribeOrder?.()
      unsubscribeVendor?.()
      unsubscribeAdmin?.()
      unsubscribeConnected?.()
      unsubscribeDisconnected?.()

      if (realtimeClient.getSubscriptions().length === 0) {
        realtimeClient.disconnect()
      }
      setIsRealtimeConnected(false)
    }
  }, [invalidateQueryKeys, orderId, queryClient, shouldUseRealtime, storeId, surface])

  useEffect(() => {
    if (surface !== 'admin-delivery' || !liveMode || !enabled || !onAdminIdle) return

    const elapsedMs = Date.now() - lastMeaningfulInteractionAt
    const remainingMs = Math.max(adminIdleMs - elapsedMs, 0)
    const timeout = window.setTimeout(() => {
      onAdminIdle()
    }, remainingMs)

    return () => window.clearTimeout(timeout)
  }, [adminIdleMs, enabled, lastMeaningfulInteractionAt, liveMode, onAdminIdle, surface])

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
    markMeaningfulInteraction,
  }
}
