/**
 * GET /address-suggestions?q=4500 duv&lat=&lng= — addresses matching what the shopper is typing, from
 * the configured address provider. Empty (with `suggests: false`) when the provider can't suggest, so
 * the form simply works as a plain form.
 */
import type { FastifyInstance } from 'fastify'
import { addressProvider } from '../commerce/addressProvider.js'

export async function addressSuggestionRoutes(app: FastifyInstance) {
  app.get('/address-suggestions', async (req, reply) => {
    const { q, lat, lng } = req.query as { q?: string; lat?: string; lng?: string }
    const provider = addressProvider()
    const query = typeof q === 'string' ? q.slice(0, 120) : ''
    const near = lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? { lat: Number(lat), lng: Number(lng) } : undefined
    const data = provider.suggests && query.trim().length >= 3 ? await provider.suggest(query, near) : []
    return reply.header('Cache-Control', 'private, max-age=60').send({ data, provider: provider.name, suggests: provider.suggests })
  })
}
