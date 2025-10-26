/**
 * @packages/realtime - Real-time WebSocket client for order notifications
 * 
 * Separate from @packages/sdk to keep concerns clean:
 * - SDK handles REST API calls
 * - Realtime handles WebSocket events
 * 
 * Both share types from @packages/schemas
 */

export { createRealtimeClient } from './client'
export type { RealtimeClient, RealtimeClientOptions } from './client'

export type {
  RealtimeEvent,
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  OrderPaymentUpdatedEvent,
  DeliveryDriverAssignedEvent,
  DeliveryDriverLocationEvent,
  DeliveryETAUpdatedEvent,
  OrderCreatedPayload,
  OrderStatusChangedPayload,
  OrderPaymentUpdatedPayload,
  DeliveryDriverAssignedPayload,
  DeliveryDriverLocationPayload,
  DeliveryETAUpdatedPayload,
  VendorEventHandler,
  CustomerEventHandler,
  OrderEventHandler,
  EventType,
  TopicType,
} from './types'

export {
  PROTOCOL_VERSION,
  DEFAULT_OPTIONS,
  WS_CLOSE_CODES,
  CONNECTION_STATE,
  type ConnectionState,
} from './protocol'

