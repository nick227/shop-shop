/**
 * GET /api/search/unified - Customer-facing search endpoint
 */
import type { FastifyInstance } from 'fastify'
import {
  MarketplaceSearchService,
  type UnifiedSearchRequest,
} from '../services/marketplace-search.service.js'

// Simple in-memory rate limiter (per-process, resets on restart)
const searchRateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100 // requests per window
const RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = searchRateMap.get(ip)

  if (!entry || now > entry.resetAt) {
    searchRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true }
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true }
}

// Align server max with frontend MAX_RADIUS_MILES = 100
const MAX_RADIUS_MILES = 100

export const searchUnifiedRoutes = async (app: FastifyInstance) => {
  const searchService = new MarketplaceSearchService()

  app.get('/api/search/unified', async (req, reply) => {
    try {
      const raw = req.query as Record<string, unknown>
      // tags accepts ?tags=vegan,gluten-free OR ?tags[]=vegan&tags[]=gluten-free
      const rawTags = raw.tags
      const tags = Array.isArray(rawTags)
        ? rawTags.filter((t): t is string => typeof t === 'string')
        : typeof rawTags === 'string'
          ? rawTags.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined

      const query: UnifiedSearchRequest = {
        q: typeof raw.q === 'string' ? raw.q : undefined,
        city: typeof raw.city === 'string' ? raw.city : undefined,
        state: typeof raw.state === 'string' ? raw.state : undefined,
        zip: typeof raw.zip === 'string' ? raw.zip : undefined,
        latitude: typeof raw.latitude === 'string' ? Number.parseFloat(raw.latitude) : undefined,
        longitude: typeof raw.longitude === 'string' ? Number.parseFloat(raw.longitude) : undefined,
        radiusMiles: typeof raw.radiusMiles === 'string' ? Number.parseFloat(raw.radiusMiles) : undefined,
        storeType: typeof raw.storeType === 'string' ? raw.storeType.toUpperCase() : undefined,
        priceRange: typeof raw.priceRange === 'string' ? raw.priceRange.toUpperCase() : undefined,
        tags: tags?.length ? tags : undefined,
      }

      // Rate limiting
      const clientIp = req.ip || req.socket?.remoteAddress || 'unknown'
      const rate = checkRateLimit(clientIp)
      if (!rate.allowed) {
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfterMs: rate.retryAfterMs,
        })
      }

      // Validate radius if provided
      if (query.radiusMiles && (query.radiusMiles < 1 || query.radiusMiles > MAX_RADIUS_MILES)) {
        return reply.code(400).send({
          error: 'Invalid radius',
          message: `Radius must be between 1 and ${MAX_RADIUS_MILES} miles`,
        })
      }

      const results = await searchService.search(query)

      return reply.code(200).send(results)
    } catch (error) {
      app.log.error(error, 'Search unified error')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Search temporarily unavailable',
      })
    }
  })
}
