/**
 * useVendorRealtimeOrders - Live order events for every store whose orders you can see.
 *
 * New orders always refresh data and show a toast naming the store. Sound and desktop
 * notifications follow each store's alert choice on this device (see orderAlertPrefs).
 * Desktop permission is only ever requested from the alerts settings, never on page load.
 */
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { OrderCreatedEvent, OrderStatusChangedEvent } from '@packages/realtime'
import { getRealtimeClient } from '@services/realtimeClient'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { formatPriceCurrency } from '@shared/lib/utils/format'
import type { OrderAlertChoice } from './orderAlertPrefs'

export interface UseVendorRealtimeOrdersOptions {
  /** Stores to listen to; only stores whose orders you may see. */
  readonly storeIds: readonly string[]
  readonly storeNames?: Readonly<Record<string, string>>
  /** Sound and desktop choice for a store at the moment an order arrives. */
  readonly alertsFor: (storeId: string) => OrderAlertChoice
  readonly onNewOrder?: (event: OrderCreatedEvent) => void
  readonly onOrderUpdate?: (event: OrderStatusChangedEvent) => void
}

const ORDER_QUERY_KEYS = [['vendor-orders'], ['vendor-pending-orders-count'], ['vendor-pending-orders-counts']] as const

let audio: HTMLAudioElement | undefined

/** Plays the new-order sound. Browsers allow it only after the person has interacted with the page. */
export function playOrderSound() {
  void playSound()
}

async function playSound() {
  try {
    audio ??= new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.currentTime = 0
    await audio.play()
  } catch {
    // Autoplay blocked until the person interacts with the page, or no audio support.
  }
}

function showDesktopNotification(storeId: string, storeName: string, orderId: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const notification = new Notification(`${storeName} · New order`, {
    body,
    icon: '/logo.png',
    tag: `order-${orderId}`,
    requireInteraction: true,
  })
  notification.addEventListener('click', () => {
    window.focus()
    window.location.assign(vendorPaths.orders(storeId))
    notification.close()
  })
}

type QueryClient = ReturnType<typeof useQueryClient>

interface OrderCreatedPayload {
  readonly orderId: string
  readonly storeId: string
  readonly customerName: string
  readonly customerId: string
  readonly total: number
  readonly deliveryType: string
  readonly status: string
}

function refreshOrders(queryClient: QueryClient) {
  for (const queryKey of ORDER_QUERY_KEYS) void queryClient.invalidateQueries({ queryKey: [...queryKey] })
}

function prependOrder(current: unknown, order: Record<string, unknown> & { readonly id: string }) {
  if (!Array.isArray(current) || current.some((o: { id?: string }) => o?.id === order.id)) return current
  return [order, ...current]
}

function withStatus(current: unknown, orderId: string, status: string) {
  if (!Array.isArray(current)) return current
  return current.map((o: { id?: string }) => (o?.id === orderId ? { ...o, status } : o))
}

function handleOrderCreated(
  queryClient: QueryClient,
  payload: OrderCreatedPayload,
  options: UseVendorRealtimeOrdersOptions,
) {
  const storeId = payload.storeId
  const storeName = options.storeNames?.[storeId] ?? 'Your store'
  const summary = `#${payload.orderId.slice(0, 8).toUpperCase()} · ${payload.customerName} · ${formatPriceCurrency(payload.total)}`
  const choice = options.alertsFor(storeId)

  if (choice.sound) playOrderSound()
  if (choice.desktop) showDesktopNotification(storeId, storeName, payload.orderId, summary)
  toast(`New order at ${storeName}`, {
    description: summary,
    action: { label: 'Open', onClick: () => window.location.assign(vendorPaths.orders(storeId)) },
  })

  queryClient.setQueriesData({ queryKey: ['vendor-orders'] }, (current: unknown) =>
    prependOrder(current, {
      id: payload.orderId,
      storeId,
      status: payload.status,
      deliveryType: payload.deliveryType,
      total: payload.total,
      createdAt: new Date().toISOString(),
      user: { id: payload.customerId, name: payload.customerName },
    }),
  )
  refreshOrders(queryClient)
}

function handleStatusChanged(queryClient: QueryClient, payload: { readonly orderId: string; readonly newStatus: string }) {
  queryClient.setQueryData(['order', payload.orderId], (current: unknown) =>
    current ? { ...(current as object), status: payload.newStatus } : current,
  )
  queryClient.setQueriesData({ queryKey: ['vendor-orders'] }, (current: unknown) =>
    withStatus(current, payload.orderId, payload.newStatus),
  )
  void queryClient.invalidateQueries({ queryKey: ['order', payload.orderId] })
  refreshOrders(queryClient)
}

export function useVendorRealtimeOrders(options: UseVendorRealtimeOrdersOptions) {
  const queryClient = useQueryClient()
  // Latest options without resubscribing on every render.
  const latest = useRef(options)
  latest.current = options
  const idsKey = [...options.storeIds].sort((a, b) => a.localeCompare(b)).join(',')

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (ids.length === 0) return

    const realtimeClient = getRealtimeClient()
    void (async () => {
      try {
        await realtimeClient.connect()
      } catch (error) {
        console.error('[Realtime] Connection failed:', error)
      }
    })()

    const onEvent = (storeId: string, event: { readonly type: string; readonly payload: unknown }) => {
      const current = latest.current
      if (event.type === 'order.created') {
        const payload = event.payload as OrderCreatedPayload
        handleOrderCreated(queryClient, { ...payload, storeId: payload.storeId || storeId }, current)
        current.onNewOrder?.(event as OrderCreatedEvent)
      } else if (event.type === 'order.status.changed') {
        handleStatusChanged(queryClient, event.payload as { orderId: string; newStatus: string })
        current.onOrderUpdate?.(event as OrderStatusChangedEvent)
      }
    }

    const unsubs = ids.map((id) => realtimeClient.subscribeVendor(id, (event) => onEvent(id, event)))
    return () => {
      for (const unsub of unsubs) unsub()
    }
  }, [idsKey, queryClient])

  return {
    isConnected: () => getRealtimeClient().isConnected(),
  }
}
