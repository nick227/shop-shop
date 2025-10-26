/**
 * Real-time Protocol Constants
 */

export const PROTOCOL_VERSION = 1

export const DEFAULT_OPTIONS = {
  reconnect: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 1.5,
  },
  heartbeat: {
    interval: 30000,
    timeout: 5000,
  },
}

export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNAUTHORIZED: 4401,
  FORBIDDEN: 4403,
  INVALID_TOKEN: 4401,
} as const

export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTING: 'disconnecting',
} as const

export type ConnectionState = typeof CONNECTION_STATE[keyof typeof CONNECTION_STATE]

