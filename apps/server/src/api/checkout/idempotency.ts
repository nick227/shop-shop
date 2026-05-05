import Redis from 'ioredis'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../../env.js'

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'idempotency:',
})

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
export function setupIdempotency(fastify: FastifyInstance, config: Partial<IdempotencyConfig> = {}) {
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
        await redis.setex(key, cfg.ttl, JSON.stringify(toStore))
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

    const stored = await redis.get(idempotencyKey).catch((err) => {
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
