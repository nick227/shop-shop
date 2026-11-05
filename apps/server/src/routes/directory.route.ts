import type { FastifyInstance } from 'fastify'
import { haversineMiles, prisma } from '@packages/db'

type ListingRow = {
  slug: string
  name: string
  categoryLabel: string
  phone: string | null
  website: string | null
  description: string | null
  addressStreet: string | null
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  latitude: { toString(): string } | null
  longitude: { toString(): string } | null
  storeId: string | null
  source: string
  id: string
}

function websiteUrl(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

function publicListing(row: ListingRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryLabel: row.categoryLabel,
    phone: row.phone,
    website: websiteUrl(row.website),
    description: row.description,
    addressStreet: row.addressStreet,
    addressCity: row.addressCity,
    addressState: row.addressState,
    addressZip: row.addressZip,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    orderable: false,
    merchant: Boolean(row.storeId),
    attribution: row.source === 'osm' ? '© OpenStreetMap contributors' : null,
  }
}

const listingSelect = {
  id: true,
  slug: true,
  name: true,
  categoryLabel: true,
  phone: true,
  website: true,
  description: true,
  addressStreet: true,
  addressCity: true,
  addressState: true,
  addressZip: true,
  latitude: true,
  longitude: true,
  storeId: true,
  source: true,
} as const

export async function directoryRoutes(app: FastifyInstance) {
  app.get('/directory', async (req, reply) => {
    const query = req.query as Record<string, string>
    const latitude = Number(query.latitude)
    const longitude = Number(query.longitude)
    const radiusMiles = Number(query.radiusMiles || '25')
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return reply.code(400).send({ error: 'Latitude and longitude are required' })
    const span = radiusMiles / 69
    const limit = Math.min(Math.max(Number(query.limit || '12') || 12, 1), 40)
    const rows = await prisma.businessListing.findMany({
      where: {
        published: true,
        latitude: { gte: latitude - span, lte: latitude + span },
        longitude: { gte: longitude - span, lte: longitude + span },
      },
      select: listingSelect,
    })
    const listings = rows.flatMap((row) => {
      const listing = publicListing(row)
      if (listing.latitude == null || listing.longitude == null) return []
      const distance = haversineMiles({ latitude, longitude }, { latitude: listing.latitude, longitude: listing.longitude })
      if (distance > radiusMiles) return []
      return [{ ...listing, distance }]
    }).sort((left, right) => left.distance - right.distance).slice(0, limit)
    return { listings }
  })

  app.get('/directory/listings/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const row = await prisma.businessListing.findUnique({ where: { slug }, select: { ...listingSelect, published: true } })
    if (!row?.published) return reply.code(404).send({ error: 'Listing not found' })
    return { listing: publicListing(row) }
  })
}
