import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'
import { chooseImportCandidate, createImportBatch, manualImportEntry, publishImportEntries, seedAustinNeighborhoods } from '../directory/import-batch.js'
import { osmSource } from '../directory/osm-source.js'
import type { ListingSource } from '../directory/types.js'

const NamesSchema = z.object({
  names: z.array(z.string().trim().min(1).max(160)).min(1).max(100),
})

const ManualSchema = z.object({
  street: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().length(2),
  zip: z.string().regex(/^\d{5}$/),
  category: z.string().trim().min(1).max(32),
  description: z.string().trim().max(2000).optional(),
})

export function adminBusinessImportRoutes(source: ListingSource = osmSource) {
  return async function routes(app: FastifyInstance) {
    app.addHook('preHandler', requireAdmin())

    app.post('/admin/business-imports', async (req, reply) => {
      const parsed = NamesSchema.safeParse(req.body)
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Enter at least one business name' })
      const adminId = req.user?.id
      if (!adminId) return reply.code(401).send({ error: 'Authentication required' })
      try {
        const batch = await createImportBatch(adminId, parsed.data.names, source)
        return reply.code(201).send(batch)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Lookup failed'
        return reply.code(502).send({ error: message })
      }
    })

    app.get('/admin/business-imports/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const batch = await prisma.businessImportBatch.findUnique({ where: { id }, include: { entries: true } })
      if (!batch) return reply.code(404).send({ error: 'Import not found' })
      return batch
    })

    app.post('/admin/business-imports/:id/publish', async (req, reply) => {
      const { id } = req.params as { id: string }
      const body = z.object({ entryIds: z.array(z.string().min(1)).min(1) }).safeParse(req.body)
      if (!body.success) return reply.code(400).send({ error: 'Choose listings to publish' })
      const imported = await publishImportEntries(id, body.data.entryIds)
      return { imported }
    })

    app.patch('/admin/business-imports/:id/entries/:entryId', async (req, reply) => {
      const { entryId } = req.params as { entryId: string }
      const body = z.object({ selectedSourceId: z.string().min(1) }).safeParse(req.body)
      if (!body.success) return reply.code(400).send({ error: 'Choose a location' })
      const entry = await chooseImportCandidate(entryId, body.data.selectedSourceId)
      if (!entry) return reply.code(404).send({ error: 'Entry not found' })
      return entry
    })

    app.post('/admin/business-imports/:id/entries/:entryId/manual', async (req, reply) => {
      const { entryId } = req.params as { entryId: string }
      const parsed = ManualSchema.safeParse(req.body)
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Enter the address you verified' })
      const listing = await manualImportEntry(entryId, { ...parsed.data, description: parsed.data.description ?? '' })
      if (!listing) return reply.code(400).send({ error: 'This name cannot be entered manually' })
      return listing
    })

    app.post('/admin/business-imports/geography', async (_req, reply) => {
      try {
        return await seedAustinNeighborhoods()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Lookup failed'
        return reply.code(502).send({ error: message })
      }
    })
  }
}
