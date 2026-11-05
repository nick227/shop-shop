import type { FastifyInstance } from 'fastify'
import { haversineMiles, prisma } from '@packages/db'

type ListingRow = {
  slug: string
  name: string
  category: string
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
  featured?: boolean
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
    category: row.category,
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
    featured: Boolean(row.featured),
    merchant: Boolean(row.storeId),
    attribution: row.source === 'osm' ? '© OpenStreetMap contributors' : null,
  }
}

const listingSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
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
  featured: true,
} as const

function groupWhere(group: string | undefined) {
  if (group === 'food') return { OR: [{ category: { in: ['RESTAURANT', 'COFFEE', 'BAKERY'] } }, { categoryLabel: { in: ['Bar', 'Pub', 'Ice cream'] } }] }
  if (group === 'grocery') return { category: 'GROCERY' }
  if (group === 'convenience') return { category: 'CONVENIENCE' }
  if (group === 'retail') return { category: 'RETAIL' }
  if (group === 'out') return { OR: [{ category: { in: ['ATTRACTION', 'ENTERTAINMENT'] } }, { categoryLabel: { in: ['Park', 'Library'] } }] }
  return {}
}

async function coverUrls(ids: readonly string[]) {
  if (ids.length === 0) return new Map<string, string>()
  const media = await prisma.mediaAsset.findMany({
    where: { listingId: { in: [...ids] }, kind: 'IMAGE' },
    orderBy: { sortIndex: 'asc' },
    select: { listingId: true, url: true },
  })
  const covers = new Map<string, string>()
  for (const row of media) {
    if (row.listingId && !covers.has(row.listingId)) covers.set(row.listingId, row.url)
  }
  return covers
}

async function nearbyListings(latitude: number, longitude: number, exceptId: string) {
  const span = 2 / 69
  const rows = await prisma.businessListing.findMany({
    where: {
      published: true,
      id: { not: exceptId },
      latitude: { gte: latitude - span, lte: latitude + span },
      longitude: { gte: longitude - span, lte: longitude + span },
    },
    select: listingSelect,
    take: 30,
  })
  return rows.flatMap((row) => {
    const listing = publicListing(row)
    if (listing.latitude == null || listing.longitude == null) return []
    const distance = haversineMiles({ latitude, longitude }, { latitude: listing.latitude, longitude: listing.longitude })
    if (distance > 2) return []
    return [{ id: listing.id, slug: listing.slug, name: listing.name, categoryLabel: listing.categoryLabel, distance, orderable: false as const }]
  }).sort((left, right) => left.distance - right.distance).slice(0, 6)
}

export async function directoryRoutes(app: FastifyInstance) {
  app.get('/directory', async (req, reply) => {
    const query = req.query as Record<string, string>
    const limit = Math.min(Math.max(Number(query.limit || '12') || 12, 1), 40)
    const q = query.q?.trim()
    const hasCoords = query.latitude !== undefined || query.longitude !== undefined
    if (!hasCoords) {
      const rows = await prisma.businessListing.findMany({
        where: {
          published: true,
          ...(q ? { name: { contains: q } } : {}),
          ...groupWhere(query.group),
        },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
        select: listingSelect,
        take: limit,
      })
      const listings = rows.map((row) => ({ ...publicListing(row), distance: null }))
      const covers = await coverUrls(listings.map((listing) => listing.id))
      return { listings: listings.map((listing) => ({ ...listing, coverUrl: covers.get(listing.id) ?? null })) }
    }
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
        ...(q ? { name: { contains: q } } : {}),
        ...groupWhere(query.group),
      },
      select: listingSelect,
    })
    const listings = rows.flatMap((row) => {
      const listing = publicListing(row)
      if (listing.latitude == null || listing.longitude == null) return []
      const distance = haversineMiles({ latitude, longitude }, { latitude: listing.latitude, longitude: listing.longitude })
      if (distance > radiusMiles) return []
      return [{ ...listing, distance }]
    }).sort((left, right) => Number(right.featured) - Number(left.featured) || left.distance - right.distance).slice(0, limit)
    const covers = await coverUrls(listings.map((listing) => listing.id))
    return { listings: listings.map((listing) => ({ ...listing, coverUrl: covers.get(listing.id) ?? null })) }
  })

  app.get('/directory/listings/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const row = await prisma.businessListing.findUnique({
      where: { slug },
      select: {
        ...listingSelect,
        published: true,
        featured: true,
        description: true,
        place: { select: { name: true, slug: true, kind: true, parent: { select: { name: true, slug: true } } } },
        store: { select: { name: true, slug: true } },
        media: { orderBy: { sortIndex: 'asc' }, select: { kind: true, url: true } },
        neighborhoodLinks: { include: { place: { select: { name: true, slug: true, published: true } } } },
      },
    })
    if (!row?.published) return reply.code(404).send({ error: 'Listing not found' })
    const listing = publicListing(row)
    const nearby = listing.latitude == null || listing.longitude == null ? [] : await nearbyListings(listing.latitude, listing.longitude, row.id)
    const city = row.place?.kind === 'CITY' ? row.place : row.place?.parent
    const neighborhood = row.place?.kind === 'NEIGHBORHOOD' ? { name: row.place.name, slug: row.place.slug } : null
    return {
      listing: {
        ...listing,
        featured: row.featured,
        images: row.media.filter((media) => media.kind === 'IMAGE').map((media) => media.url),
        videos: row.media.filter((media) => media.kind === 'VIDEO').map((media) => media.url),
        neighborhood,
        city: city ? { name: city.name, slug: city.slug } : null,
        neighborhoods: row.neighborhoodLinks.filter((link) => link.place.published).map((link) => ({ name: link.place.name, slug: link.place.slug })),
        store: row.store ? { name: row.store.name, slug: row.store.slug } : null,
        nearby,
      },
    }
  })
}
