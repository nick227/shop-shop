import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '../middleware/rbac.js'
import { bulkListings, listingDetail, searchListings } from '../directory/listing-admin.js'
import { mergeListings, updateListing } from '../directory/listing-edit.js'

const EditSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(32),
  categoryLabel: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40),
  website: z.string().trim().max(500),
  description: z.string().trim().max(4000),
  addressStreet: z.string().trim().max(160),
  addressCity: z.string().trim().max(80),
  addressState: z.string().trim().max(2),
  addressZip: z.string().trim().max(5),
  published: z.boolean(),
  featured: z.boolean(),
  placeId: z.string().nullable(),
  neighborhoodIds: z.array(z.string()).max(12),
  featuredNeighborhoodIds: z.array(z.string()).max(12),
  imageUrls: z.array(z.string().trim().url()).max(8),
  videoUrls: z.array(z.string().trim().url()).max(4),
  storeId: z.string().nullable(),
})

export async function adminBusinessRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin())

  app.get('/admin/businesses', async (req) => searchListings(req.query as Record<string, string>))

  app.get('/admin/businesses/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const listing = await listingDetail(id)
    if (!listing) return reply.code(404).send({ error: 'Listing not found' })
    return { listing }
  })

  app.patch('/admin/businesses/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = EditSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Check the listing fields' })
    const saved = await updateListing(id, parsed.data)
    if ('error' in saved) return reply.code(saved.status).send({ error: saved.error })
    const listing = await listingDetail(id)
    return { listing }
  })

  app.post('/admin/businesses/bulk', async (req, reply) => {
    const parsed = z.object({
      ids: z.array(z.string()).min(1).max(100),
      action: z.enum(['publish', 'unpublish', 'feature', 'unfeature']),
    }).safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Choose listings and an action' })
    return bulkListings(parsed.data.ids, parsed.data.action)
  })

  app.post('/admin/businesses/merge', async (req, reply) => {
    const parsed = z.object({ keepId: z.string().min(1), dropId: z.string().min(1) }).safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Choose the listing to keep' })
    const saved = await mergeListings(parsed.data.keepId, parsed.data.dropId)
    if ('error' in saved) return reply.code(saved.status).send({ error: saved.error })
    return saved
  })
}
