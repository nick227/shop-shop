import { prisma } from '@packages/db'

type ScoreRow = {
  addressStreet: string | null
  addressCity: string | null
  addressZip: string | null
  phone: string | null
  website: string | null
  description: string | null
  latitude: unknown
}

export function listingScore(row: ScoreRow): number {
  return [row.addressStreet, row.addressCity, row.addressZip, row.phone, row.website, row.description, row.latitude].filter((value) => value != null && String(value).length > 0).length
}

const listSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  categoryLabel: true,
  addressCity: true,
  addressZip: true,
  addressStreet: true,
  phone: true,
  website: true,
  description: true,
  latitude: true,
  published: true,
  featured: true,
  source: true,
  sourceId: true,
  storeId: true,
  createdAt: true,
  updatedAt: true,
  place: { select: { id: true, name: true } },
} as const

export async function searchListings(query: Record<string, string | undefined>) {
  const take = Math.min(Math.max(Number(query.take || '40') || 40, 1), 50)
  const skip = Math.max(Number(query.skip || '0') || 0, 0)
  const where = {
    ...(query.q ? { name: { contains: query.q } } : {}),
    ...(query.zip ? { addressZip: query.zip } : {}),
    ...(query.city ? { addressCity: { contains: query.city } } : {}),
    ...(query.category ? { AND: [{ OR: [{ category: query.category }, { categoryLabel: { contains: query.category } }] }] } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.published === 'true' || query.published === 'false' ? { published: query.published === 'true' } : {}),
    ...(query.placeId ? { OR: [{ placeId: query.placeId }, { neighborhoodLinks: { some: { placeId: query.placeId } } }] } : {}),
    ...(query.neighborhood ? { OR: [{ place: { name: { contains: query.neighborhood } } }, { neighborhoodLinks: { some: { place: { name: { contains: query.neighborhood } } } } }] } : {}),
  }
  if (query.sort === 'completeness') {
    const rows = await prisma.businessListing.findMany({ where, select: listSelect })
    const ordered = rows.map((row) => ({ ...present(row), completeness: listingScore(row) })).sort((left, right) => right.completeness - left.completeness)
    return { total: ordered.length, listings: ordered.slice(skip, skip + take) }
  }
  const orderBy = query.sort === 'imported' ? { createdAt: 'desc' as const } : query.sort === 'updated' ? { updatedAt: 'desc' as const } : { name: 'asc' as const }
  const [total, rows] = await Promise.all([
    prisma.businessListing.count({ where }),
    prisma.businessListing.findMany({ where, orderBy, skip, take, select: listSelect }),
  ])
  return { total, listings: rows.map((row) => ({ ...present(row), completeness: listingScore(row) })) }
}

function present(row: { latitude: unknown; createdAt: Date; updatedAt: Date; place: { id: string; name: string } | null }) {
  const { latitude, createdAt, updatedAt, place, ...rest } = row
  return { ...rest, place, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() }
}

export async function listingDetail(id: string) {
  const row = await prisma.businessListing.findUnique({
    where: { id },
    include: {
      place: { select: { id: true, name: true, slug: true, kind: true } },
      store: { select: { id: true, name: true, slug: true } },
      media: { orderBy: { sortIndex: 'asc' }, select: { kind: true, url: true } },
      neighborhoodLinks: { include: { place: { select: { id: true, name: true, slug: true } } } },
      imports: { orderBy: { updatedAt: 'desc' }, take: 8, select: { id: true, submittedName: true, status: true, selectedSourceId: true, batchId: true, updatedAt: true } },
    },
  })
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    categoryLabel: row.categoryLabel,
    phone: row.phone,
    website: row.website,
    description: row.description,
    addressStreet: row.addressStreet,
    addressCity: row.addressCity,
    addressState: row.addressState,
    addressZip: row.addressZip,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    published: row.published,
    featured: row.featured,
    source: row.source,
    sourceId: row.sourceId,
    sourceFetchedAt: row.sourceFetchedAt.toISOString(),
    completeness: listingScore(row),
    place: row.place,
    store: row.store,
    images: row.media.filter((media) => media.kind === 'IMAGE').map((media) => media.url),
    videos: row.media.filter((media) => media.kind === 'VIDEO').map((media) => media.url),
    neighborhoods: row.neighborhoodLinks.map((link) => ({ ...link.place, featured: link.featured })),
    imports: row.imports.map((entry) => ({ ...entry, updatedAt: entry.updatedAt.toISOString() })),
  }
}

export async function bulkListings(ids: readonly string[], action: 'publish' | 'unpublish' | 'feature' | 'unfeature') {
  const data = action === 'publish' ? { published: true } : action === 'unpublish' ? { published: false } : action === 'feature' ? { featured: true } : { featured: false }
  const result = await prisma.businessListing.updateMany({ where: { id: { in: [...ids] } }, data })
  return { updated: result.count }
}
