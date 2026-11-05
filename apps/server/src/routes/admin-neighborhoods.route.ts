import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'
import { createNeighborhood, parseNeighborhoodBody, updateNeighborhood } from './neighborhood-profile.js'

export async function adminNeighborhoodRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin())

  app.get('/admin/neighborhoods/cities', async () => {
    const cities = await prisma.place.findMany({
      where: { kind: 'CITY' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        state: true,
        slug: true,
        postalCodes: { select: { code: true }, orderBy: { code: 'asc' } },
      },
    })
    return {
      cities: cities.map((city) => ({
        id: city.id,
        name: city.name,
        state: city.state,
        slug: city.slug,
        postalCodes: city.postalCodes.map((zip) => zip.code),
      })),
    }
  })

  app.get('/admin/neighborhoods', async () => {
    const rows = await prisma.place.findMany({
      where: { kind: 'NEIGHBORHOOD' },
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, name: true, state: true, slug: true } },
        postalLinks: { select: { postalCode: true }, orderBy: { postalCode: 'asc' } },
        media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, select: { url: true } },
      },
    })
    return {
      neighborhoods: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        headline: row.headline,
        about: row.about,
        published: row.published,
        city: row.parent,
        postalCodes: row.postalLinks.map((link) => link.postalCode),
        imageUrls: row.media.map((media) => media.url),
      })),
    }
  })

  app.post('/admin/neighborhoods', async (req, reply) => {
    const parsed = parseNeighborhoodBody(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Invalid neighborhood' })
    const saved = await createNeighborhood(parsed.data)
    if ('error' in saved) return reply.code(saved.status ?? 400).send({ error: saved.error })
    return reply.code(201).send(saved)
  })

  app.patch('/admin/neighborhoods/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = parseNeighborhoodBody(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Invalid neighborhood' })
    const saved = await updateNeighborhood(id, parsed.data)
    if ('error' in saved) return reply.code(saved.status ?? 400).send({ error: saved.error })
    return saved
  })
}
