import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'

export async function placeRoutes(app: FastifyInstance) {
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
      where: { slug, kind: 'NEIGHBORHOOD', published: true },
      include: {
        parent: { select: { id: true, name: true, state: true } },
        postalLinks: { select: { postalCode: true }, orderBy: { postalCode: 'asc' } },
        media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, select: { url: true } },
      },
    })
    if (!place?.parent) return reply.code(404).send({ error: 'Neighborhood not found' })
    const nearby = await prisma.place.findMany({
      where: { kind: 'NEIGHBORHOOD', published: true, parentId: place.parent.id, id: { not: place.id } },
      orderBy: { name: 'asc' },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        headline: true,
        media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1, select: { url: true } },
      },
    })
    return {
      id: place.id,
      name: place.name,
      slug: place.slug,
      headline: place.headline,
      about: place.about,
      latitude: place.latitude == null ? null : Number(place.latitude),
      longitude: place.longitude == null ? null : Number(place.longitude),
      city: place.parent,
      postalCodes: place.postalLinks.map((link) => link.postalCode),
      images: place.media.map((media) => media.url),
      nearby: nearby.map((area) => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        headline: area.headline,
        coverUrl: area.media[0]?.url ?? null,
      })),
    }
  })
}
