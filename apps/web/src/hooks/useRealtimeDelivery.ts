import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface RealtimeDeliveryEvent {
  type: 'delivery.status.updated' | 'delivery.location.updated'
  topic: string
  timestamp: string
  payload: {
    deliveryJobId: string
    orderId: string
    userId: string
    storeId: string
    previousStatus?: string
    newStatus?: string
    providerStatus?: string
    provider: string
    location?: {
      latitude?: number
      longitude?: number
      address?: any
    }
    source: string
  }
}

export function useRealtimeDelivery(orderId?: string, userId?: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeDeliveryEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connectWebSocket = () => {
    if (!orderId || !userId) return

    try {
      // Get auth token from store
      const token = localStorage.getItem('auth_token')
      if (!token) return

      // Connect to WebSocket with token
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/realtime?token=${token}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Realtime] Connected to delivery updates')
        setIsConnected(true)
        
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeDeliveryEvent = JSON.parse(event.data)
          
          if (
            realtimeEvent.payload.orderId === orderId &&
            realtimeEvent.payload.userId === userId
          ) {
            setLastEvent(realtimeEvent)
            
            // Invalidate related queries
            if (realtimeEvent.type === 'delivery.status.updated') {
              queryClient.invalidateQueries({
                queryKey: ['delivery-tracking', orderId]
              })
              queryClient.invalidateQueries({
                queryKey: ['delivery-job', orderId]
              })
            }
            
            if (realtimeEvent.type === 'delivery.location.updated') {
              queryClient.invalidateQueries({
                queryKey: ['delivery-tracking', orderId]
              })
            }
          }
        } catch (error) {
          console.error('[Realtime] Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log(`[Realtime] Disconnected: ${event.code} - ${event.reason}`)
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect after 5 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 5000)
        }
      }

      ws.onerror = (error) => {
        console.error('[Realtime] WebSocket error:', error)
        setIsConnected(false)
      }

    } catch (error) {
      console.error('[Realtime] Failed to connect to WebSocket:', error)
    }
  }

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }

  useEffect(() => {
    if (orderId && userId) {
      connectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [orderId, userId])

  return {
    isConnected,
    lastEvent,
    disconnect: disconnectWebSocket,
    reconnect: connectWebSocket
  }
}
