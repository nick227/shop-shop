import type { FastifyInstance } from 'fastify'
import { haversineMiles, prisma } from '@packages/db'
import { neighborhoodGuide } from '../directory/neighborhood-guide.js'
import { placeTagInclude, placeTagView } from './neighborhood-tags.js'

export async function placeRoutes(app: FastifyInstance) {
  app.get('/places/neighborhoods', async (req) => {
    const q = String((req.query as { q?: string }).q ?? '').trim()
    const rows = await prisma.place.findMany({
      where: {
        kind: 'NEIGHBORHOOD',
        published: true,
        ...(q ? {
          OR: [
            { name: { contains: q } },
            { parent: { name: { contains: q } } },
            { postalLinks: { some: { postalCode: q } } },
          ],
        } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        headline: true,
        parent: { select: { name: true, state: true, slug: true } },
        postalLinks: { select: { postalCode: true } },
        media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1, select: { url: true } },
      },
    })
    return {
      neighborhoods: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        headline: row.headline,
        city: row.parent,
        postalCodes: row.postalLinks.map((link) => link.postalCode),
        coverUrl: row.media[0]?.url ?? null,
      })),
    }
  })

  app.get('/places/by-zip/:code', async (req, reply) => {
    const { code } = req.params as { code: string }
    if (!/^\d{5}$/.test(code)) return reply.code(400).send({ error: 'ZIP code must be 5 digits' })
    const postal = await prisma.postalCode.findUnique({
      where: { code },
      include: {
        city: { select: { id: true, name: true, state: true, slug: true } },
        places: {
          where: { place: { kind: 'NEIGHBORHOOD', published: true } },
          include: {
            place: {
              select: {
                id: true,
                name: true,
                slug: true,
                headline: true,
                about: true,
                media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    })
    if (!postal) return reply.code(404).send({ error: 'Unknown ZIP code' })
    const neighborhoods = postal.places
      .map((link) => ({
        id: link.place.id,
        name: link.place.name,
        slug: link.place.slug,
        headline: link.place.headline,
        about: link.place.about,
        coverUrl: link.place.media[0]?.url ?? null,
      }))
      .sort((left, right) => left.name.localeCompare(right.name))
    return { city: postal.city, neighborhoods }
  })

  app.get('/places/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const place = await prisma.place.findFirst({
      where: {
        slug,
        OR: [
          { kind: 'CITY' },
          { kind: 'NEIGHBORHOOD', published: true },
        ],
      },
      include: {
        parent: { select: { id: true, name: true, state: true, slug: true } },
        postalLinks: { select: { postalCode: true }, orderBy: { postalCode: 'asc' } },
        media: { orderBy: { sortIndex: 'asc' }, select: { url: true, kind: true } },
        tags: placeTagInclude,
      },
    })
    if (!place || (place.kind === 'NEIGHBORHOOD' && !place.parent)) {
      return reply.code(404).send({ error: 'Place not found' })
    }
    const origin = place.latitude != null && place.longitude != null
      ? { latitude: Number(place.latitude), longitude: Number(place.longitude) }
      : null
    const parentId = place.kind === 'CITY' ? place.id : place.parent?.id
    const candidates = await prisma.place.findMany({
      where: {
        kind: 'NEIGHBORHOOD',
        published: true,
        parentId,
        ...(place.kind === 'NEIGHBORHOOD' ? { id: { not: place.id } } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        headline: true,
        latitude: true,
        longitude: true,
        media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1, select: { url: true } },
      },
    })
    const nearby = candidates
      .map((area) => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        headline: area.headline,
        coverUrl: area.media[0]?.url ?? null,
        distance: origin && area.latitude != null && area.longitude != null
          ? haversineMiles(origin, { latitude: Number(area.latitude), longitude: Number(area.longitude) })
          : null,
      }))
      .sort((left, right) => (left.distance ?? 999) - (right.distance ?? 999) || left.name.localeCompare(right.name))
      .slice(0, place.kind === 'CITY' ? 8 : 6)
    const city = place.kind === 'CITY'
      ? { name: place.name, state: place.state, slug: place.slug }
      : { name: place.parent?.name ?? '', state: place.parent?.state ?? null, slug: place.parent?.slug ?? '' }
    return {
      id: place.id,
      name: place.name,
      slug: place.slug,
      headline: place.headline,
      about: place.about,
      latitude: place.latitude == null ? null : Number(place.latitude),
      longitude: place.longitude == null ? null : Number(place.longitude),
      city,
      postalCodes: place.postalLinks.map((link) => link.postalCode),
      images: place.media.filter((media) => media.kind === 'IMAGE').map((media) => media.url),
      videos: place.media.filter((media) => media.kind === 'VIDEO').map((media) => media.url),
      // Hidden rows are sent too: they tell the client which automatic suggestions an admin turned off.
      tags: place.tags.map(placeTagView),
      nearby: nearby.map((area) => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        headline: area.headline,
        coverUrl: area.coverUrl,
      })),
    }
  })

  app.get('/places/:slug/guide', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const guide = await neighborhoodGuide(slug)
    if (!guide) return reply.code(404).send({ error: 'Neighborhood not found' })
    return guide
  })
}
