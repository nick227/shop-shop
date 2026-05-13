/**
 * Realtime Client Singleton;
 * Shared WebSocket client for vendor and customer real-time events;
 */

import { createRealtimeClient, type RealtimeClient } from '@packages/realtime'
import { useAuthStore } from '@stores/authStore'
import { env } from '../env'

const REALTIME_LOG_PREFIX = '[Realtime]'

// Create singleton client;
let clientInstance: RealtimeClient | undefined;

function getDefaultRealtimeUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3005/realtime'
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/realtime`
}

export function getRealtimeClient(): RealtimeClient {
  if (!clientInstance) {
    const wsUrl = env.VITE_WS_URL ?? getDefaultRealtimeUrl()

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
        debug: (msg, data) => console.log(REALTIME_LOG_PREFIX, msg, data),
        info: (msg, data) => console.log(REALTIME_LOG_PREFIX, msg, data),
        warn: (msg, data) => console.warn(REALTIME_LOG_PREFIX, msg, data),
        error: (msg, data) => console.error(REALTIME_LOG_PREFIX, msg, data)}})

    // Listen to lifecycle events;
    clientInstance.on('connected', () => {
      console.log(`${REALTIME_LOG_PREFIX} Connected to server`)
    })

    clientInstance.on('disconnected', ({ reason }) => {
      console.log(`${REALTIME_LOG_PREFIX} Disconnected:`, reason)
    })

    clientInstance.on('reconnecting', ({ attempt }) => {
      console.log(`${REALTIME_LOG_PREFIX} Reconnecting (attempt ${attempt})`)
    })

    clientInstance.on('error', (error) => {
      console.error(`${REALTIME_LOG_PREFIX} Error:`, error)
    })
  }

  return clientInstance;
}

// Reset client (for testing or auth changes)
export function resetRealtimeClient() {
  if (clientInstance) {
    clientInstance.disconnect()
    clientInstance = undefined;
  }
}
