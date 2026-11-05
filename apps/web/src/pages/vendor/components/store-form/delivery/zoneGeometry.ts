/** Shapes on the delivery map, in Leaflet's [lat, lng] order. The server stores GeoJSON [lng, lat]. */
export type LatLng = [number, number]

export interface ZoneDto {
  readonly id: string
  readonly name: string
  readonly polygonJson: { readonly type?: string; readonly coordinates?: number[][][] } | null
  readonly baseFee: string | number
  readonly minOrder: string | number | null
  readonly isActive: boolean
  readonly priority: number
}

/** The open ring (no repeated first point) for drawing. */
export function zoneRing(zone: ZoneDto): LatLng[] {
  const ring = zone.polygonJson?.coordinates?.[0] ?? []
  const points = ring.map(([lng, lat]) => [lat, lng] as LatLng)
  const first = points[0]
  const last = points.at(-1)
  if (points.length > 1 && first && last && first[0] === last[0] && first[1] === last[1]) points.pop()
  return points
}

export function toGeoJson(ring: readonly LatLng[]) {
  const closed = [...ring, ring[0]].map(([lat, lng]) => [lng, lat])
  return { type: 'Polygon' as const, coordinates: [closed] }
}

function cross(o: LatLng, a: LatLng, b: LatLng) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

function segmentsCross(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng) {
  const d1 = cross(p3, p4, p1)
  const d2 = cross(p3, p4, p2)
  const d3 = cross(p1, p2, p3)
  const d4 = cross(p1, p2, p4)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

/** Whether the outline crosses itself; mirrors the server's check so problems show while drawing. */
export function ringCrosses(ring: readonly LatLng[]): boolean {
  const n = ring.length
  if (n < 4) return false
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue
      if (segmentsCross(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) return true
    }
  }
  return false
}

/** Rough area in square miles, so a vendor can sanity-check what they drew. */
export function ringSquareMiles(ring: readonly LatLng[]): number {
  if (ring.length < 3) return 0
  const lat0 = (ring.reduce((sum, [lat]) => sum + lat, 0) / ring.length) * (Math.PI / 180)
  const x = (p: LatLng) => p[1] * 69.172 * Math.cos(lat0)
  const y = (p: LatLng) => p[0] * 69
  let sum = 0
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    sum += x(a) * y(b) - x(b) * y(a)
  }
  return Math.abs(sum) / 2
}

/** A starting square around a point, about `miles` across. */
export function squareAround([lat, lng]: LatLng, miles: number): LatLng[] {
  const dLat = miles / 2 / 69
  const dLng = miles / 2 / (69.172 * Math.cos((lat * Math.PI) / 180))
  return [
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
    [lat - dLat, lng - dLng],
  ]
}

export const ZONE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#db2777', '#0891b2']
