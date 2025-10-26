/**
 * Real-time WebSocket Client
 * Handles connection, subscriptions, auto-reconnect, and heartbeat
 */

import {
  type RealtimeEvent,
  type TopicType,
  type VendorEventHandler,
  type CustomerEventHandler,
  type OrderEventHandler,
  type GenericEventHandler,
  type ProtocolMessage,
  type AckMessage,
} from './types'
import { PROTOCOL_VERSION, DEFAULT_OPTIONS, WS_CLOSE_CODES, CONNECTION_STATE, type ConnectionState } from './protocol'

export interface RealtimeClientOptions {
  url: string
  getAuth: () => string | Promise<string>
  reconnect?: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    multiplier?: number
  }
  heartbeat?: {
    interval?: number
    timeout?: number
  }
  logger?: {
    debug: (msg: string, data?: any) => void
    info: (msg: string, data?: any) => void
    warn: (msg: string, data?: any) => void
    error: (msg: string, data?: any) => void
  }
}

type LifecycleEvent = 'connected' | 'disconnected' | 'reconnecting' | 'error'
type LifecycleHandler = (data?: any) => void

export interface RealtimeClient {
  connect(): Promise<void>
  disconnect(): void
  subscribe<T = RealtimeEvent>(topic: TopicType, handler: (event: T) => void): () => void
  subscribeVendor(storeId: string, handler: VendorEventHandler): () => void
  subscribeCustomer(userId: string, handler: CustomerEventHandler): () => void
  subscribeOrder(orderId: string, handler: OrderEventHandler): () => void
  on(event: LifecycleEvent, handler: LifecycleHandler): () => void
  isConnected(): boolean
  getState(): ConnectionState
  getSubscriptions(): string[]
}

export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  const config = {
    ...options,
    reconnect: { ...DEFAULT_OPTIONS.reconnect, ...options.reconnect },
    heartbeat: { ...DEFAULT_OPTIONS.heartbeat, ...options.heartbeat },
    logger: options.logger || {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  }

  let ws: WebSocket | null = null
  let state: ConnectionState = CONNECTION_STATE.DISCONNECTED
  let reconnectAttempt = 0
  let reconnectTimer: number | null = null
  let heartbeatTimer: number | null = null
  let heartbeatTimeoutTimer: number | null = null

  const subscriptions = new Map<string, Set<GenericEventHandler>>()
  const lifecycleHandlers = new Map<LifecycleEvent, Set<LifecycleHandler>>()
  const pendingSubscriptions = new Set<string>()

  // Emit lifecycle event
  const emit = (event: LifecycleEvent, data?: any) => {
    lifecycleHandlers.get(event)?.forEach(handler => handler(data))
  }

  // Send message to server
  const send = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  // Subscribe to topic
  const doSubscribe = (topic: string) => {
    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, new Set())
    }
    send({ type: 'subscribe', topic })
    pendingSubscriptions.add(topic)
  }

  // Unsubscribe from topic
  const doUnsubscribe = (topic: string) => {
    send({ type: 'unsubscribe', topic })
    subscriptions.delete(topic)
    pendingSubscriptions.delete(topic)
  }

  // Start heartbeat
  const startHeartbeat = (interval: number) => {
    stopHeartbeat()
    heartbeatTimer = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
        
        // Set timeout for pong response
        heartbeatTimeoutTimer = window.setTimeout(() => {
          config.logger.warn('Heartbeat timeout - reconnecting')
          reconnect()
        }, config.heartbeat.timeout!)
      }
    }, interval)
  }

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer)
      heartbeatTimeoutTimer = null
    }
  }

  // Handle incoming messages
  const handleMessage = (data: string) => {
    try {
      const message: ProtocolMessage = JSON.parse(data)

      if (message.type === 'ack') {
        const ack = message as AckMessage
        config.logger.info('Connected', { clientId: ack.clientId })
        state = CONNECTION_STATE.CONNECTED
        reconnectAttempt = 0
        emit('connected', ack)
        
        // Start heartbeat
        startHeartbeat(ack.pingInterval)
        
        // Resubscribe to all topics
        subscriptions.forEach((_, topic) => {
          doSubscribe(topic)
        })
      }
      
      if (message.type === 'subscribed') {
        pendingSubscriptions.delete(message.topic)
        config.logger.debug('Subscribed to topic', message.topic)
      }
      
      if (message.type === 'pong') {
        // Clear timeout
        if (heartbeatTimeoutTimer) {
          clearTimeout(heartbeatTimeoutTimer)
          heartbeatTimeoutTimer = null
        }
      }
      
      if (message.type === 'error') {
        config.logger.error('Server error', message)
        emit('error', message)
      }
      
      // Handle events
      if (message.type && message.type.includes('.')) {
        const event = message as RealtimeEvent
        const handlers = subscriptions.get(event.topic)
        if (handlers) {
          handlers.forEach(handler => handler(event))
        }
      }
    } catch (error) {
      config.logger.error('Failed to parse message', error)
    }
  }

  // Reconnect logic
  const reconnect = () => {
    if (state === CONNECTION_STATE.RECONNECTING || state === CONNECTION_STATE.CONNECTING) {
      return
    }

    if (reconnectAttempt >= config.reconnect.maxAttempts!) {
      config.logger.error('Max reconnect attempts reached')
      state = CONNECTION_STATE.DISCONNECTED
      emit('disconnected', { reason: 'max_attempts' })
      return
    }

    state = CONNECTION_STATE.RECONNECTING
    emit('reconnecting', { attempt: reconnectAttempt + 1 })

    const delay = Math.min(
      config.reconnect.initialDelay! * Math.pow(config.reconnect.multiplier!, reconnectAttempt),
      config.reconnect.maxDelay!
    )

    reconnectAttempt++
    config.logger.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt})`)

    reconnectTimer = window.setTimeout(() => {
      connect()
    }, delay)
  }

  // Connect to WebSocket
  const connect = async (): Promise<void> => {
    if (state === CONNECTION_STATE.CONNECTED || state === CONNECTION_STATE.CONNECTING) {
      return
    }

    try {
      state = CONNECTION_STATE.CONNECTING
      const token = await config.getAuth()
      const wsUrl = `${config.url}?token=${encodeURIComponent(token)}`

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        config.logger.info('WebSocket opened')
        // Send hello
        send({ type: 'hello', version: PROTOCOL_VERSION })
      }

      ws.onmessage = (event) => {
        handleMessage(event.data)
      }

      ws.onerror = (error) => {
        config.logger.error('WebSocket error', error)
        emit('error', error)
      }

      ws.onclose = (event) => {
        config.logger.info('WebSocket closed', { code: event.code, reason: event.reason })
        stopHeartbeat()
        
        const wasConnected = state === CONNECTION_STATE.CONNECTED
        state = CONNECTION_STATE.DISCONNECTED
        
        if (wasConnected && event.code !== WS_CLOSE_CODES.NORMAL) {
          // Unexpected close - reconnect
          reconnect()
        } else {
          emit('disconnected', { code: event.code, reason: event.reason })
        }
      }
    } catch (error) {
      config.logger.error('Failed to connect', error)
      state = CONNECTION_STATE.DISCONNECTED
      emit('error', error)
      throw error
    }
  }

  // Disconnect
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    
    stopHeartbeat()
    
    if (ws) {
      state = CONNECTION_STATE.DISCONNECTING
      ws.close(WS_CLOSE_CODES.NORMAL, 'Client disconnect')
      ws = null
    }
    
    state = CONNECTION_STATE.DISCONNECTED
    subscriptions.clear()
    pendingSubscriptions.clear()
  }

  // Subscribe to topic
  const subscribe = <T = RealtimeEvent>(topic: TopicType, handler: (event: T) => void): (() => void) => {
    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, new Set())
      
      // If connected, subscribe immediately
      if (state === CONNECTION_STATE.CONNECTED) {
        doSubscribe(topic)
      }
    }

    subscriptions.get(topic)!.add(handler as GenericEventHandler)

    // Return unsubscribe function
    return () => {
      const handlers = subscriptions.get(topic)
      if (handlers) {
        handlers.delete(handler as GenericEventHandler)
        if (handlers.size === 0) {
          doUnsubscribe(topic)
        }
      }
    }
  }

  // Helper: Subscribe to vendor events
  const subscribeVendor = (storeId: string, handler: VendorEventHandler): (() => void) => {
    return subscribe(`vendor:${storeId}`, handler)
  }

  // Helper: Subscribe to customer events
  const subscribeCustomer = (userId: string, handler: CustomerEventHandler): (() => void) => {
    return subscribe(`customer:${userId}`, handler)
  }

  // Helper: Subscribe to order events
  const subscribeOrder = (orderId: string, handler: OrderEventHandler): (() => void) => {
    return subscribe(`order:${orderId}`, handler)
  }

  // Lifecycle event listener
  const on = (event: LifecycleEvent, handler: LifecycleHandler): (() => void) => {
    if (!lifecycleHandlers.has(event)) {
      lifecycleHandlers.set(event, new Set())
    }
    lifecycleHandlers.get(event)!.add(handler)

    return () => {
      lifecycleHandlers.get(event)?.delete(handler)
    }
  }

  // Get connection state
  const isConnected = (): boolean => {
    return state === CONNECTION_STATE.CONNECTED
  }

  const getState = (): ConnectionState => {
    return state
  }

  const getSubscriptions = (): string[] => {
    return Array.from(subscriptions.keys())
  }

  return {
    connect,
    disconnect,
    subscribe,
    subscribeVendor,
    subscribeCustomer,
    subscribeOrder,
    on,
    isConnected,
    getState,
    getSubscriptions,
  }
}

