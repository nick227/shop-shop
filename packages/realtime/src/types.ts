/**
 * Real-time Event Types
 */

// Event types
export type EventType = 
  | 'order.created'
  | 'order.status.changed'
  | 'order.updated'
  | 'order.canceled'
  | 'order.payment.updated'
  | 'delivery.driver.assigned'
  | 'delivery.driver.location'
  | 'delivery.eta.updated'

// Topic patterns
export type TopicType = 
  | `vendor:${string}`      // vendor:{storeId}
  | `customer:${string}`    // customer:{userId}
  | `order:${string}`       // order:{orderId}

// Base event envelope
export interface RealtimeEvent<T = unknown> {
  type: EventType
  topic: TopicType
  timestamp: string
  payload: T
}

// Order created event payload
export interface OrderCreatedPayload {
  orderId: string
  storeId: string
  customerId: string
  customerName: string
  total: number
  deliveryType: 'DELIVERY' | 'PICKUP'
  status: string
  itemCount: number
}

// Order status changed event payload
export interface OrderStatusChangedPayload {
  orderId: string
  oldStatus?: string
  newStatus: string
  changedBy?: string
  estimatedReady?: string
  note?: string
}

// Payment status changed event payload
export interface OrderPaymentUpdatedPayload {
  orderId: string
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  stripePaymentIntentId?: string
}

// Delivery driver assigned event payload
export interface DeliveryDriverAssignedPayload {
  orderId: string
  driverId: string
  driverName: string
  driverPhone?: string
  estimatedArrival: string
}

// Delivery driver location update payload
export interface DeliveryDriverLocationPayload {
  orderId: string
  driverId: string
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  timestamp: string
}

// Delivery ETA updated payload
export interface DeliveryETAUpdatedPayload {
  orderId: string
  estimatedArrival: string
  distanceRemaining?: number
  reason?: string
}

// Typed events
export type OrderCreatedEvent = RealtimeEvent<OrderCreatedPayload>
export type OrderStatusChangedEvent = RealtimeEvent<OrderStatusChangedPayload>
export type OrderPaymentUpdatedEvent = RealtimeEvent<OrderPaymentUpdatedPayload>
export type DeliveryDriverAssignedEvent = RealtimeEvent<DeliveryDriverAssignedPayload>
export type DeliveryDriverLocationEvent = RealtimeEvent<DeliveryDriverLocationPayload>
export type DeliveryETAUpdatedEvent = RealtimeEvent<DeliveryETAUpdatedPayload>

// Protocol messages
export interface HelloMessage {
  type: 'hello'
  version: number
}

export interface AckMessage {
  type: 'ack'
  version: number
  pingInterval: number
  clientId: string
}

export interface SubscribeMessage {
  type: 'subscribe'
  topic: TopicType
}

export interface SubscribedMessage {
  type: 'subscribed'
  topic: TopicType
}

export interface UnsubscribeMessage {
  type: 'unsubscribe'
  topic: TopicType
}

export interface ErrorMessage {
  type: 'error'
  message: string
  code?: string
}

export interface PingMessage {
  type: 'ping'
}

export interface PongMessage {
  type: 'pong'
}

export type ProtocolMessage = 
  | HelloMessage
  | AckMessage
  | SubscribeMessage
  | SubscribedMessage
  | UnsubscribeMessage
  | ErrorMessage
  | PingMessage
  | PongMessage
  | RealtimeEvent

// Event handler types
export type VendorEventHandler = (
  event: OrderCreatedEvent | OrderStatusChangedEvent | OrderPaymentUpdatedEvent
) => void

export type CustomerEventHandler = (
  event: OrderStatusChangedEvent | 
    OrderPaymentUpdatedEvent | 
    DeliveryDriverAssignedEvent | 
    DeliveryDriverLocationEvent | 
    DeliveryETAUpdatedEvent
) => void

export type OrderEventHandler = (
  event: OrderStatusChangedEvent | 
    OrderPaymentUpdatedEvent | 
    DeliveryDriverAssignedEvent | 
    DeliveryDriverLocationEvent | 
    DeliveryETAUpdatedEvent
) => void

export type GenericEventHandler = (event: RealtimeEvent) => void

