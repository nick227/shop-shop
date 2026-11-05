import { randomUUID } from 'crypto'
import { prisma } from '@packages/db'
import { importAustinZips, loadAustinZipAreas, type ZipArea } from './austin-zips.js'
import { placeForZip, zipAt } from './geo.js'
import { loadAustinBusinesses } from './osm-coverage.js'
import { austinNeighborhoods } from './osm-source.js'
import { seedAustinNeighborhoods } from './seed-neighborhoods.js'
import type { ListingCandidate } from './types.js'

export type CoverageReport = {
  readonly zips: { readonly total: number; readonly created: number; readonly updated: number }
  readonly neighborhoods: { readonly created: number; readonly preserved: number; readonly unpublished: number }
  readonly businesses: {
    readonly found: number
    readonly created: number
    readonly existing: number
    readonly unmatched: number
    readonly byCategory: Readonly<Record<string, number>>
  }
  readonly coverage: {
    readonly zipsWithListings: number
    readonly zipsWithoutListings: readonly string[]
    readonly listingsWithoutZip: number
    readonly listingsWithoutNeighborhood: number
  }
}

function slugFor(name: string, sourceId: string): string {
  const part = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const tail = sourceId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `austin-${part}-${tail}`.slice(0, 160)
}

async function neighborhoodIds(cityId: string): Promise<Map<string, string[]>> {
  const links = await prisma.placePostalCode.findMany({
    where: { place: { kind: 'NEIGHBORHOOD', parentId: cityId } },
    select: { postalCode: true, placeId: true },
  })
  const map = new Map<string, string[]>()
  for (const link of links) {
    const ids = map.get(link.postalCode) ?? []
    ids.push(link.placeId)
    map.set(link.postalCode, ids)
  }
  return map
}

function locatedZip(candidate: ListingCandidate, areas: readonly ZipArea[]): string | null {
  if (candidate.zip) return candidate.zip
  if (candidate.latitude == null || candidate.longitude == null) return null
  return zipAt(candidate.longitude, candidate.latitude, areas)
}

async function writeListings(candidates: readonly ListingCandidate[], areas: readonly ZipArea[], cityId: string, links: ReadonlyMap<string, readonly string[]>) {
  const rows = candidates.flatMap((candidate) => {
    if (candidate.latitude == null || candidate.longitude == null) return []
    const zip = locatedZip(candidate, areas)
    return [{
      id: randomUUID(),
      name: candidate.name.slice(0, 160),
      slug: slugFor(candidate.name, candidate.sourceId),
      category: candidate.category,
      categoryLabel: candidate.categoryLabel,
      phone: candidate.phone,
      website: candidate.website,
      description: candidate.description,
      addressStreet: candidate.street,
      addressCity: candidate.city ?? (zip ? 'Austin' : null),
      addressState: candidate.state ?? (zip ? 'TX' : null),
      addressZip: zip,
      latitude: candidate.latitude.toFixed(8),
      longitude: candidate.longitude.toFixed(8),
      placeId: placeForZip(zip, links, cityId),
      source: candidate.source,
      sourceId: candidate.sourceId,
      published: true,
    }]
  })
  for (let index = 0; index < rows.length; index += 200) {
    await prisma.businessListing.createMany({ data: rows.slice(index, index + 200), skipDuplicates: true })
  }
}

async function assignPlaces(areas: readonly ZipArea[], cityId: string, links: ReadonlyMap<string, readonly string[]>) {
  const rows = await prisma.businessListing.findMany({
    where: { storeId: null, latitude: { not: null }, longitude: { not: null } },
    select: { id: true, latitude: true, longitude: true, addressZip: true, placeId: true },
  })
  const zipGroups = new Map<string, string[]>()
  const placeGroups = new Map<string, string[]>()
  for (const row of rows) {
    const zip = row.addressZip ?? zipAt(Number(row.longitude), Number(row.latitude), areas)
    const placeId = placeForZip(zip, links, cityId)
    if (zip && zip !== row.addressZip) {
      const ids = zipGroups.get(zip) ?? []
      ids.push(row.id)
      zipGroups.set(zip, ids)
    }
    if (placeId !== row.placeId) {
      const ids = placeGroups.get(placeId) ?? []
      ids.push(row.id)
      placeGroups.set(placeId, ids)
    }
  }
  for (const [zip, ids] of zipGroups) {
    for (let index = 0; index < ids.length; index += 400) {
      await prisma.businessListing.updateMany({ where: { id: { in: ids.slice(index, index + 400) }, storeId: null, addressZip: null }, data: { addressZip: zip, addressCity: 'Austin', addressState: 'TX' } })
    }
  }
  for (const [placeId, ids] of placeGroups) {
    for (let index = 0; index < ids.length; index += 400) {
      await prisma.businessListing.updateMany({ where: { id: { in: ids.slice(index, index + 400) }, storeId: null }, data: { placeId } })
    }
  }
}

export async function seedAustinCoverage(): Promise<CoverageReport> {
  const austin = await prisma.place.findUnique({ where: { slug: 'austin-tx' }, select: { id: true } })
  if (!austin) throw new Error('Austin is not in the place directory')
  const areas = await loadAustinZipAreas()
  const zips = await importAustinZips(austin.id, areas)
  const neighborhoods = await seedAustinNeighborhoods(await austinNeighborhoods(zips.box))
  const found = await loadAustinBusinesses(zips.box)
  const known = new Set((await prisma.businessListing.findMany({ select: { sourceId: true } })).map((row) => row.sourceId))
  const before = await prisma.businessListing.count()
  const links = await neighborhoodIds(austin.id)
  const byCategory: Record<string, number> = {}
  let unmatched = 0
  for (const candidate of found) {
    byCategory[candidate.categoryLabel] = (byCategory[candidate.categoryLabel] ?? 0) + 1
    if (!locatedZip(candidate, areas)) unmatched += 1
  }
  await writeListings(found.filter((candidate) => !known.has(candidate.sourceId)), areas, austin.id, links)
  await assignPlaces(areas, austin.id, links)
  const created = await prisma.businessListing.count() - before
  const grouped = await prisma.businessListing.groupBy({ by: ['addressZip'], where: { published: true, addressZip: { not: null } }, _count: { _all: true } })
  const covered = new Set(grouped.flatMap((row) => row.addressZip ? [row.addressZip] : []))
  const zipsWithoutListings = areas.map((area) => area.code).filter((code) => !covered.has(code)).sort()
  return {
    zips: { total: areas.length, created: zips.created, updated: zips.updated },
    neighborhoods: {
      ...neighborhoods,
      unpublished: await prisma.place.count({ where: { kind: 'NEIGHBORHOOD', parentId: austin.id, published: false } }),
    },
    businesses: { found: found.length, created, existing: found.filter((candidate) => known.has(candidate.sourceId)).length, unmatched, byCategory },
    coverage: {
      zipsWithListings: areas.length - zipsWithoutListings.length,
      zipsWithoutListings,
      listingsWithoutZip: await prisma.businessListing.count({ where: { published: true, addressZip: null } }),
      listingsWithoutNeighborhood: await prisma.businessListing.count({ where: { published: true, OR: [{ placeId: null }, { placeId: austin.id }] } }),
    },
  }
}
