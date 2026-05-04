/**
 * Checkout Idempotency Middleware
 * 
 * Prevents duplicate order creation on checkout retry.
 * Uses Redis to store processed idempotency keys with TTL.
 */

import Redis from 'ioredis'
import { FastifyRequest, FastifyReply } from 'fastify'
import { env } from '../../env'

// ========================================
// Redis Client
// ========================================

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'idempotency:'
})

// ========================================
// Types & Interfaces
// ========================================

export interface IdempotencyConfig {
  ttl: number // Time to live in seconds (default: 24 hours)
  keyHeader: string // Header name for idempotency key
  responseHeader: string // Header name for original response
}

export interface StoredResponse {
  statusCode: number
  headers: Record<string, string>
  body: any
  timestamp: string
}

// ========================================
// Default Configuration
// ========================================

const defaultConfig: IdempotencyConfig = {
  ttl: 24 * 60 * 60, // 24 hours
  keyHeader: 'X-Idempotency-Key',
  responseHeader: 'X-Idempotency-Response'
}

// ========================================
// Idempotency Key Generation
// ========================================

function generateIdempotencyKey(): string {
  return `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function validateIdempotencyKey(key: string): boolean {
  // Basic validation - should be alphanumeric with underscores
  return /^[a-zA-Z0-9_-]{8,64}$/.test(key)
}

// ========================================
// Response Storage & Retrieval
// ========================================

async function storeResponse(
  key: string, 
  response: StoredResponse, 
  ttl: number = defaultConfig.ttl
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(response))
  } catch (error) {
    console.error('Failed to store idempotency response:', error)
    throw new Error('Failed to store response for idempotency')
  }
}

async function getStoredResponse(key: string): Promise<StoredResponse | null> {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to retrieve idempotency response:', error)
    return null
  }
}

// ========================================
// Idempotency Middleware
// ========================================

export function createIdempotencyMiddleware(config: Partial<IdempotencyConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return async function idempotencyMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // Only apply to checkout endpoints
    if (!request.url.includes('/checkout')) {
      return
    }

    const idempotencyKey = request.headers[finalConfig.keyHeader.toLowerCase()] as string

    // If no idempotency key, generate one for the client
    if (!idempotencyKey) {
      const newKey = generateIdempotencyKey()
      reply.header(finalConfig.keyHeader, newKey)
      return
    }

    // Validate idempotency key format
    if (!validateIdempotencyKey(idempotencyKey)) {
      reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid idempotency key format'
      })
      return
    }

    // Check if we have a stored response for this key
    const storedResponse = await getStoredResponse(idempotencyKey)

    if (storedResponse) {
      // Return the stored response
      reply.status(storedResponse.statusCode)
      
      // Copy headers from stored response
      Object.entries(storedResponse.headers).forEach(([key, value]) => {
        reply.header(key, value)
      })
      
      // Add idempotency response header
      reply.header(finalConfig.responseHeader, 'true')
      
      return reply.send(storedResponse.body)
    }

    // Register an onSend hook on the server to capture and store the response body
    request.server.addHook('onSend', async (req, rep, payload) => {
      if (req !== request) return payload
      if (rep.statusCode >= 200 && rep.statusCode < 300) {
        const responseToStore: StoredResponse = {
          statusCode: rep.statusCode,
          headers: rep.getHeaders() as Record<string, string>,
          body: payload,
          timestamp: new Date().toISOString()
        }
        await storeResponse(idempotencyKey, responseToStore, finalConfig.ttl)
      }
      return payload
    })
  }
}

// ========================================
// Utility Functions
// ========================================

export async function clearIdempotencyKey(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Failed to clear idempotency key:', error)
  }
}

export async function clearExpiredIdempotencyKeys(): Promise<void> {
  try {
    // Redis handles TTL automatically, but we can add cleanup logic if needed
    console.log('Idempotency cleanup completed by Redis TTL')
  } catch (error) {
    console.error('Failed to cleanup expired idempotency keys:', error)
  }
}

export async function getIdempotencyStats(): Promise<{
  totalKeys: number
  activeKeys: number
}> {
  try {
    const keys = await redis.keys('*')
    return {
      totalKeys: keys.length,
      activeKeys: keys.length // All keys are active since Redis handles TTL
    }
  } catch (error) {
    console.error('Failed to get idempotency stats:', error)
    return { totalKeys: 0, activeKeys: 0 }
  }
}
