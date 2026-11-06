import { haversineMiles, prisma } from '@packages/db'
import { GUIDE_TITLES, guideGroup, type GuideGroup } from './guide-group.js'

type GuideListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly category: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly website: string | null
  readonly phone: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly featured: boolean
  readonly distance: number | null
  readonly orderable: false
  readonly merchant: boolean
}

export async function neighborhoodGuide(slug: string) {
  const place = await prisma.place.findFirst({
    where: { slug, kind: 'NEIGHBORHOOD', published: true },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      postalLinks: { select: { postalCode: true } },
      curatedListings: { select: { listingId: true, featured: true } },
    },
  })
  if (!place) return null
  const zips = place.postalLinks.map((link) => link.postalCode)
  const curated = new Map(place.curatedListings.map((link) => [link.listingId, link.featured]))
  const origin = place.latitude != null && place.longitude != null
    ? { latitude: Number(place.latitude), longitude: Number(place.longitude) }
    : null
  const span = 3 / 69
  const local = [
    ...(zips.length > 0 ? [{ addressZip: { in: zips } }] : []),
    { placeId: place.id },
  ]
  const rows = await prisma.businessListing.findMany({
    where: {
      published: true,
      OR: [
        {
          AND: [
            { OR: local },
            ...(origin ? [{
              latitude: { gte: origin.latitude - span, lte: origin.latitude + span },
              longitude: { gte: origin.longitude - span, lte: origin.longitude + span },
            }] : []),
          ],
        },
        ...(curated.size > 0 ? [{ id: { in: [...curated.keys()] } }] : []),
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      categoryLabel: true,
      addressStreet: true,
      website: true,
      phone: true,
      featured: true,
      latitude: true,
      longitude: true,
      storeId: true,
    },
    take: 240,
  })
  const buckets = new Map<GuideGroup, GuideListing[]>()
  for (const row of rows) {
    const featured = row.featured || curated.get(row.id) === true
    const point = row.latitude != null && row.longitude != null && origin
      ? haversineMiles(origin, { latitude: Number(row.latitude), longitude: Number(row.longitude) })
      : null
    const listing: GuideListing = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      categoryLabel: row.categoryLabel,
      addressStreet: row.addressStreet,
      website: row.website,
      phone: row.phone,
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude),
      featured,
      distance: point,
      orderable: false,
      merchant: Boolean(row.storeId),
    }
    if (featured) {
      const featuredRows = buckets.get('featured') ?? []
      featuredRows.push(listing)
      buckets.set('featured', featuredRows)
      continue
    }
    const group = guideGroup(row.category, row.categoryLabel)
    if (!group) continue
    const grouped = buckets.get(group) ?? []
    grouped.push(listing)
    buckets.set(group, grouped)
  }
  const order: GuideGroup[] = ['featured', 'food', 'shopping', 'arts', 'parks']
  return {
    note: 'These places share a ZIP code or an admin link with this neighborhood. A ZIP is not a boundary.',
    sections: order.flatMap((id) => {
      const listings = (buckets.get(id) ?? []).sort((left, right) => (left.distance ?? 99) - (right.distance ?? 99)).slice(0, 8)
      return listings.length > 0 ? [{ id, title: GUIDE_TITLES[id], listings }] : []
    }),
  }
}
