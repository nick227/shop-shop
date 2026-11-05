import type { FastifyInstance } from 'fastify'
import { haversineMiles, prisma } from '@packages/db'

export async function directoryRoutes(app: FastifyInstance) {
  app.get('/directory', async (req, reply) => {
    const query = req.query as Record<string, string>
    const latitude = Number(query.latitude)
    const longitude = Number(query.longitude)
    const radiusMiles = Number(query.radiusMiles || '25')
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return reply.code(400).send({ error: 'Latitude and longitude are required' })
    const span = radiusMiles / 69
    const rows = await prisma.businessListing.findMany({
      where: {
        published: true,
        latitude: { gte: latitude - span, lte: latitude + span },
        longitude: { gte: longitude - span, lte: longitude + span },
      },
      select: {
        id: true,
        name: true,
        categoryLabel: true,
        phone: true,
        website: true,
        description: true,
        addressStreet: true,
        addressCity: true,
        addressZip: true,
        latitude: true,
        longitude: true,
        storeId: true,
        source: true,
      },
    })
    const listings = rows.flatMap((row) => {
      if (row.latitude == null || row.longitude == null) return []
      const point = { latitude: Number(row.latitude), longitude: Number(row.longitude) }
      const distance = haversineMiles({ latitude, longitude }, point)
      if (distance > radiusMiles) return []
      return [{
        id: row.id,
        name: row.name,
        categoryLabel: row.categoryLabel,
        phone: row.phone,
        website: row.website,
        description: row.description,
        addressStreet: row.addressStreet,
        addressCity: row.addressCity,
        addressZip: row.addressZip,
        distance,
        orderable: false,
        merchant: Boolean(row.storeId),
        attribution: row.source === 'osm' ? '© OpenStreetMap contributors' : null,
      }]
    }).sort((left, right) => left.distance - right.distance)
    return { listings }
  })
}
