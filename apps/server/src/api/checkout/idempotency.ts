import Redis from 'ioredis'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../../env.js'

/**
 * Where replayable responses live. Redis when it is connected; otherwise an in-process store, so a
 * missing Redis costs nothing at request time (no retries, no offline queue) instead of ~8s per call.
 *
 * Checkout does not depend on this for correctness: sessions are cheap to start again and completing
 * a session twice returns the same order (see completeCheckout). This only saves repeated work and
 * replays exact responses to retried requests.
 */
export interface IdempotencyStore {
  get(key: string): Promise<string | null>
  set(key: string, ttlSeconds: number, value: string): Promise<void>
}

const MEMORY_LIMIT = 2000

export function memoryIdempotencyStore(now: () => number = Date.now): IdempotencyStore {
  const entries = new Map<string, { value: string; expiresAt: number }>()
  return {
    async get(key) {
      const hit = entries.get(key)
      if (!hit) return null
      if (hit.expiresAt <= now()) {
        entries.delete(key)
        return null
      }
      return hit.value
    },
    async set(key, ttlSeconds, value) {
      entries.delete(key)
      entries.set(key, { value, expiresAt: now() + ttlSeconds * 1000 })
      // Oldest first: drop the least recently written once over the limit.
      while (entries.size > MEMORY_LIMIT) entries.delete(entries.keys().next().value as string)
    },
  }
}

export function redisFallbackStore(redisUrl: string, log: (message: string) => void = console.warn): IdempotencyStore {
  const memory = memoryIdempotencyStore()
  const redis = new Redis(redisUrl, {
    keyPrefix: 'idempotency:',
    lazyConnect: true,
    // Fail fast: with no connection a command errors at once instead of queueing and retrying.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    connectTimeout: 1000,
    commandTimeout: 300,
    retryStrategy: (attempt) => Math.min(attempt * 2000, 30_000),
  })
  let warned = false
  redis.on('error', () => {
    if (!warned) {
      warned = true
      log('Idempotency: Redis unavailable; replaying responses from memory on this server only.')
    }
  })
  redis.on('ready', () => {
    warned = false
  })
  redis.connect().catch(() => undefined)
  const ready = () => redis.status === 'ready'
  return {
    async get(key) {
      if (!ready()) return memory.get(key)
      return redis.get(key).catch(() => memory.get(key))
    },
    async set(key, ttlSeconds, value) {
      await memory.set(key, ttlSeconds, value)
      if (ready()) await redis.setex(key, ttlSeconds, value).catch(() => undefined)
    },
  }
}

let sharedStore: IdempotencyStore | null = null
const defaultStore = () => (sharedStore ??= redisFallbackStore(env.REDIS_URL))

export interface IdempotencyConfig {
  ttl: number
  keyHeader: string
  responseHeader: string
}

interface StoredResponse {
  statusCode: number
  headers: Record<string, string | number | string[]>
  body: unknown
  timestamp: string
}

const defaults: IdempotencyConfig = {
  ttl: 24 * 60 * 60,
  keyHeader: 'X-Idempotency-Key',
  responseHeader: 'X-Idempotency-Response',
}

function generateKey(): string {
  return `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

function validateKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(key)
}

type RequestWithIdempotency = FastifyRequest & { _idempotencyKey?: string }

/**
 * Register idempotency hooks on a Fastify plugin scope.
 * Call once inside the plugin that owns the routes you want to protect.
 * The onSend hook is registered once per plugin scope — not per request.
 */
export function setupIdempotency(
  fastify: FastifyInstance,
  config: Partial<IdempotencyConfig> = {},
  store: IdempotencyStore = defaultStore(),
) {
  const cfg = { ...defaults, ...config }

  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    const key = (request as RequestWithIdempotency)._idempotencyKey
    if (!key) return payload

    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      try {
        const toStore: StoredResponse = {
          statusCode: reply.statusCode,
          headers: reply.getHeaders() as Record<string, string | number | string[]>,
          body: payload,
          timestamp: new Date().toISOString(),
        }
        await store.set(key, cfg.ttl, JSON.stringify(toStore))
      } catch (err) {
        request.log.error({ err }, 'Failed to store idempotency response')
      }
    }
    return payload
  })

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'GET') return

    const keyHeader = cfg.keyHeader.toLowerCase()
    const rawKey = request.headers[keyHeader]
    const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : rawKey

    if (!idempotencyKey) {
      reply.header(cfg.keyHeader, generateKey())
      return
    }

    if (!validateKey(idempotencyKey)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid idempotency key. Must be 8–64 alphanumeric characters (a-z, 0-9, _, -).',
      })
    }

    const stored = await store.get(idempotencyKey).catch((err) => {
      request.log.warn({ err }, 'Failed to retrieve idempotency response — proceeding without cache')
      return null
    })

    if (stored) {
      const cached = JSON.parse(stored) as StoredResponse
      reply.status(cached.statusCode)
      for (const [k, v] of Object.entries(cached.headers)) {
        reply.header(k, v as string)
      }
      reply.header(cfg.responseHeader, 'true')
      return reply.send(cached.body)
    }

    ;(request as RequestWithIdempotency)._idempotencyKey = idempotencyKey
  })
}
