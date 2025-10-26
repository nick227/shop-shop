# @packages/realtime

Real-time WebSocket client for order notifications.

## Features

- ✅ Type-safe event handling
- ✅ Auto-reconnect with exponential backoff
- ✅ Heartbeat/ping-pong
- ✅ Topic-based subscriptions
- ✅ Multi-client support (vendor/customer/admin)
- ✅ Lifecycle events
- ✅ Clean API

## Installation

```bash
# Already installed as workspace package
```

## Usage

### Create Client

```typescript
import { createRealtimeClient } from '@packages/realtime'

const realtimeClient = createRealtimeClient({
  url: 'ws://localhost:3005/realtime',
  getAuth: () => getToken(), // Returns JWT
  reconnect: {
    maxAttempts: 10,
    initialDelay: 1000,
  },
})
```

### Connect

```typescript
await realtimeClient.connect()
```

### Subscribe to Vendor Events

```typescript
const unsubscribe = realtimeClient.subscribeVendor(storeId, (event) => {
  if (event.type === 'order.created') {
    console.log('New order!', event.payload)
    // Play sound, show notification, refresh orders
  }
  
  if (event.type === 'order.status.changed') {
    console.log('Order updated', event.payload)
    // Update order in UI
  }
})

// Later: cleanup
unsubscribe()
```

### Subscribe to Customer Events

```typescript
const unsubscribe = realtimeClient.subscribeCustomer(userId, (event) => {
  if (event.type === 'order.status.changed') {
    console.log('Your order status:', event.payload.newStatus)
    // Update tracking page
  }
})
```

### Subscribe to Specific Order

```typescript
const unsubscribe = realtimeClient.subscribeOrder(orderId, (event) => {
  console.log('Order update:', event.payload)
})
```

### Lifecycle Events

```typescript
realtimeClient.on('connected', () => {
  console.log('Connected!')
})

realtimeClient.on('disconnected', ({ reason }) => {
  console.log('Disconnected:', reason)
})

realtimeClient.on('reconnecting', ({ attempt }) => {
  console.log('Reconnecting...', attempt)
})

realtimeClient.on('error', (error) => {
  console.error('Error:', error)
})
```

### Disconnect

```typescript
realtimeClient.disconnect()
```

## Events

### Vendor Events

**order.created** - New order placed
```typescript
{
  type: 'order.created',
  topic: 'vendor:{storeId}',
  timestamp: '2025-10-19T08:00:00Z',
  payload: {
    orderId: string
    customerName: string
    total: number
    deliveryType: 'DELIVERY' | 'PICKUP'
    // ...
  }
}
```

**order.status.changed** - Order status updated
```typescript
{
  type: 'order.status.changed',
  topic: 'vendor:{storeId}',
  payload: {
    orderId: string
    newStatus: string
    // ...
  }
}
```

### Customer Events

**order.status.changed** - Your order status changed
```typescript
{
  type: 'order.status.changed',
  topic: 'customer:{userId}',
  payload: {
    orderId: string
    newStatus: string
    estimatedReady: string
  }
}
```

## Protocol

- **Version**: 1
- **Transport**: JSON over WebSocket
- **Auth**: JWT in query param `?token=`
- **Heartbeat**: 30 second ping/pong
- **Auto-reconnect**: Exponential backoff
- **Topics**: `vendor:{storeId}`, `customer:{userId}`, `order:{orderId}`

## Architecture

This package is separate from `@packages/sdk`:
- SDK = REST API (auto-generated from OpenAPI)
- Realtime = WebSocket (hand-written, clean API)
- Both share types from `@packages/schemas`

Benefits:
- Clean separation of concerns
- Independent versioning
- Optional (load only where needed)
- Type-safe throughout

