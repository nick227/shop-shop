import { randomUUID } from 'crypto'
import { prisma } from '@packages/db'
import { classifyName } from './classify.js'
import type { ListingCandidate, ListingSource } from './types.js'

function slugFor(name: string, sourceId: string): string {
  const part = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const tail = sourceId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `austin-${part}-${tail}`.slice(0, 160)
}

async function placeForZip(zip: string | null): Promise<string | null> {
  const austin = await prisma.place.findUnique({ where: { slug: 'austin-tx' }, select: { id: true } })
  if (!zip) return austin?.id ?? null
  const postal = await prisma.postalCode.findUnique({
    where: { code: zip },
    include: { places: { include: { place: { select: { id: true, kind: true } } } } },
  })
  if (!postal) return austin?.id ?? null
  const neighborhoods = postal.places.filter((link) => link.place.kind === 'NEIGHBORHOOD')
  return neighborhoods.length === 1 ? neighborhoods[0].place.id : postal.cityPlaceId
}

async function saveListing(candidate: ListingCandidate, storeId: string | null) {
  const existing = await prisma.businessListing.findUnique({ where: { sourceId: candidate.sourceId } })
  if (existing) return existing
  return prisma.businessListing.create({
    data: {
      name: candidate.name,
      slug: slugFor(candidate.name, candidate.sourceId),
      category: candidate.category,
      categoryLabel: candidate.categoryLabel,
      phone: candidate.phone,
      website: candidate.website,
      description: candidate.description,
      addressStreet: candidate.street,
      addressCity: candidate.city,
      addressState: candidate.state,
      addressZip: candidate.zip,
      latitude: candidate.latitude == null ? null : candidate.latitude.toFixed(8),
      longitude: candidate.longitude == null ? null : candidate.longitude.toFixed(8),
      placeId: await placeForZip(candidate.zip),
      storeId,
      source: candidate.source,
      sourceId: candidate.sourceId,
      published: true,
    },
  })
}

export async function createImportBatch(adminId: string, names: readonly string[], source: ListingSource) {
  const submitted = [...new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))].slice(0, 100)
  const found = submitted.length > 0 ? await source.search(submitted) : []
  const [listings, stores] = await Promise.all([
    prisma.businessListing.findMany({ select: { sourceId: true, name: true, latitude: true, longitude: true } }),
    prisma.store.findMany({ select: { id: true, name: true, latitude: true, longitude: true } }),
  ])
  const knownListings = listings.map((row) => ({
    sourceId: row.sourceId,
    name: row.name,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
  }))
  const knownStores = stores.map((row) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
  }))
  const batch = await prisma.businessImportBatch.create({
    data: {
      id: randomUUID(),
      adminId,
      entries: {
        create: submitted.map((name) => {
          const decision = classifyName(name, found, knownListings, knownStores)
          return {
            id: randomUUID(),
            submittedName: name,
            status: decision.status,
            candidates: decision.candidates,
            selectedSourceId: decision.selectedSourceId,
          }
        }),
      },
    },
    include: { entries: true },
  })
  return batch
}

export async function publishImportEntries(batchId: string, entryIds: readonly string[]) {
  const entries = await prisma.businessImportEntry.findMany({ where: { batchId, id: { in: [...entryIds] } } })
  const imported: string[] = []
  for (const entry of entries) {
    const candidates = entry.candidates as unknown as ListingCandidate[]
    const chosen = candidates.find((candidate) => candidate.sourceId === entry.selectedSourceId)
    if (!chosen) continue
    if (entry.status !== 'READY' && entry.status !== 'REVIEW') continue
    const listing = await saveListing(chosen, null)
    await prisma.businessImportEntry.update({ where: { id: entry.id }, data: { status: 'IMPORTED', listingId: listing.id } })
    imported.push(entry.id)
  }
  return imported
}

export async function chooseImportCandidate(entryId: string, sourceId: string) {
  const entry = await prisma.businessImportEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.status === 'IMPORTED') return null
  const candidates = entry.candidates as unknown as ListingCandidate[]
  if (!candidates.some((candidate) => candidate.sourceId === sourceId)) return null
  return prisma.businessImportEntry.update({ where: { id: entryId }, data: { selectedSourceId: sourceId, status: 'REVIEW' } })
}

const CATEGORIES: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  COFFEE: 'Coffee',
  BAKERY: 'Bakery',
  GROCERY: 'Grocery',
  CONVENIENCE: 'Convenience',
  RETAIL: 'Shop',
  ATTRACTION: 'Attraction',
  OTHER: 'Place',
}

export async function manualImportEntry(entryId: string, input: { street: string; city: string; state: string; zip: string; category: string; description: string }) {
  const entry = await prisma.businessImportEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.status !== 'NOT_FOUND') return null
  const label = CATEGORIES[input.category]
  if (!label) return null
  const listing = await saveListing({
    source: 'admin',
    sourceId: `admin/${entry.id}`,
    name: entry.submittedName,
    category: input.category,
    categoryLabel: label,
    street: input.street,
    city: input.city,
    state: input.state,
    zip: input.zip,
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    description: input.description.trim() || null,
    evidence: ['admin entered'],
  }, null)
  await prisma.businessImportEntry.update({ where: { id: entry.id }, data: { status: 'IMPORTED', listingId: listing.id } })
  return listing
}
