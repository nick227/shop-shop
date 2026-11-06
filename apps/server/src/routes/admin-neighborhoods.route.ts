import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'
import { createNeighborhood, parseNeighborhoodBody, updateNeighborhood } from './neighborhood-profile.js'
import { placeTagInclude, placeTagView } from './neighborhood-tags.js'

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

  app.get('/admin/neighborhoods', async (req) => {
    const query = req.query as { q?: string; published?: string }
    const rows = await prisma.place.findMany({
      where: {
        kind: 'NEIGHBORHOOD',
        ...(query.published === 'true' || query.published === 'false' ? { published: query.published === 'true' } : {}),
        ...(query.q ? { OR: [{ name: { contains: query.q } }, { postalLinks: { some: { postalCode: query.q } } }] } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, name: true, state: true, slug: true } },
        postalLinks: { select: { postalCode: true }, orderBy: { postalCode: 'asc' } },
        media: { orderBy: { sortIndex: 'asc' }, select: { url: true, kind: true } },
        tags: placeTagInclude,
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
        latitude: row.latitude == null ? null : Number(row.latitude),
        longitude: row.longitude == null ? null : Number(row.longitude),
        city: row.parent,
        postalCodes: row.postalLinks.map((link) => link.postalCode),
        imageUrls: row.media.filter((media) => media.kind === 'IMAGE').map((media) => media.url),
        videoUrls: row.media.filter((media) => media.kind === 'VIDEO').map((media) => media.url),
        tags: row.tags.map(placeTagView),
        ready: Boolean(row.headline && row.about),
      })),
    }
  })

  app.post('/admin/neighborhoods/publish', async (req, reply) => {
    const parsed = z.object({ ids: z.array(z.string()).min(1).max(200) }).safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Choose neighborhoods to publish' })
    const rows = await prisma.place.findMany({
      where: { id: { in: parsed.data.ids }, kind: 'NEIGHBORHOOD' },
      select: { id: true, headline: true, about: true },
    })
    const ready = rows.filter((row) => row.headline && row.about).map((row) => row.id)
    if (ready.length > 0) await prisma.place.updateMany({ where: { id: { in: ready } }, data: { published: true } })
    return { published: ready.length, skipped: rows.length - ready.length }
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
