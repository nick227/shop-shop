import { prisma } from '@packages/db'
import { boxFromRings, ringCentroid, type GeoBox, type LngLat } from './geo.js'

const ZIP_URL = 'https://data.austintexas.gov/resource/49ja-3mqz.json?$limit=80'
const USER_AGENT = 'ShopShop/0.1 (neighborhood directory import)'

type ZipRow = {
  zipcode?: string
  the_geom?: { type?: string; coordinates?: number[][][] | number[][][][] }
}

export type ZipArea = {
  readonly code: string
  readonly rings: readonly (readonly LngLat[])[]
}

function outerRings(row: ZipRow): LngLat[][] {
  const geometry = row.the_geom
  if (!geometry?.coordinates) return []
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0] as number[][] | undefined
    return ring ? [ring.map((point) => [point[0], point[1]] as LngLat)] : []
  }
  return (geometry.coordinates as number[][][][]).flatMap((polygon) => {
    const ring = polygon[0]
    return ring ? [ring.map((point) => [point[0], point[1]] as LngLat)] : []
  })
}

export async function loadAustinZipAreas(): Promise<ZipArea[]> {
  const response = await fetch(ZIP_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Austin ZIP lookup failed (${response.status})`)
  const rows = await response.json() as ZipRow[]
  return rows.flatMap((row) => {
    const code = row.zipcode ?? ''
    const rings = outerRings(row).filter((ring) => ring.length > 3)
    if (!/^\d{5}$/.test(code) || rings.length === 0) return []
    return [{ code, rings }]
  })
}

export async function importAustinZips(cityPlaceId: string, areas: readonly ZipArea[]): Promise<{ created: number; updated: number; box: GeoBox }> {
  const known = new Set((await prisma.postalCode.findMany({ select: { code: true } })).map((row) => row.code))
  let created = 0
  let updated = 0
  for (const area of areas) {
    const center = ringCentroid(area.rings[0])
    const data = {
      latitude: center.latitude.toFixed(8),
      longitude: center.longitude.toFixed(8),
      boundaryJson: { type: 'MultiPolygon', coordinates: area.rings.map((ring) => [ring]) },
    }
    if (known.has(area.code)) {
      await prisma.postalCode.update({ where: { code: area.code }, data })
      updated += 1
    } else {
      await prisma.postalCode.create({ data: { code: area.code, cityPlaceId, ...data } })
      created += 1
    }
  }
  return { created, updated, box: boxFromRings(areas.flatMap((area) => area.rings)) }
}
