/*
 * SDK Realtime Entrypoint
 * Re-exports the realtime WebSocket client and types for convenience.
 */

import {
  createRealtimeClient as createClient,
  type RealtimeClient,
} from '@packages/realtime'

export {
  createClient as createRealtimeClient,
  type RealtimeClient,
}

export type {
  RealtimeEvent,
  TopicType,
  EventType,
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  OrderPaymentUpdatedEvent,
  DeliveryDriverAssignedEvent,
  DeliveryDriverLocationEvent,
  DeliveryETAUpdatedEvent,
} from '@packages/realtime'

export interface CreateRealtimeWithSdkAuthOptions {
  /** WebSocket URL, e.g. ws://localhost:3005/realtime */
  url: string
  /** Function that returns a JWT for Authorization */
  getToken: () => string | Promise<string>
}

/**
 * Helper to create a realtime client using the SDK's auth token provider.
 */
export function createRealtimeClientWithSdkAuth(options: CreateRealtimeWithSdkAuthOptions) {
  const { url, getToken } = options
  return createClient({
    url,
    getAuth: getToken,
  })
}


