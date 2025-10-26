/**
 * Realtime Client Singleton;
 * Shared WebSocket client for vendor and customer real-time events;
 */

import { createRealtimeClient, type RealtimeClient } from '@packages/realtime'
import { useAuthStore } from '@stores/authStore'
import { env } from '../env'

// Create singleton client;
let clientInstance: RealtimeClient | null = null;
export function getRealtimeClient(): RealtimeClient {
  if (!clientInstance) {
    const wsUrl = env.VITE_WS_URL || 'ws://localhost:3005/realtime'

    clientInstance = createRealtimeClient({
      url: wsUrl,
      getAuth: () => {
        const token = useAuthStore.getState().token;
        if (!token) {
          throw new Error('No auth token available')
        }
        return token;
      },
      reconnect: {
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 30_000},
      logger: {
        debug: (msg, data) => console.log('[Realtime]', msg, data),
        info: (msg, data) => console.log('[Realtime]', msg, data),
        warn: (msg, data) => console.warn('[Realtime]', msg, data),
        error: (msg, data) => console.error('[Realtime]', msg, data)}})

    // Listen to lifecycle events;
    clientInstance.on('connected', () => {
      console.log('[Realtime] Connected to server')
    })

    clientInstance.on('disconnected', ({ reason }) => {
      console.log('[Realtime] Disconnected:', reason)
    })

    clientInstance.on('reconnecting', ({ attempt }) => {
      console.log('[Realtime] Reconnecting (attempt', attempt, ')')
    })

    clientInstance.on('error', (error) => {
      console.error('[Realtime] Error:', error)
    })
  }

  return clientInstance;
}

// Reset client (for testing or auth changes)
export function resetRealtimeClient() {
  if (clientInstance) {
    clientInstance.disconnect()
    clientInstance = null;
  }
}

