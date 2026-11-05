/**
 * Delivery zone shapes: what a vendor draws must be a real, simple area before shoppers are judged by it.
 */

export interface ZonePolygon {
  readonly type: 'Polygon'
  /** One ring of [lng, lat] positions, closed (first = last). */
  readonly coordinates: [number, number][][]
}

const MAX_VERTICES = 200

type Point = readonly [number, number]

function cross(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

function segmentsCross(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(p3, p4, p1)
  const d2 = cross(p3, p4, p2)
  const d3 = cross(p1, p2, p3)
  const d4 = cross(p1, p2, p4)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

function ringArea(ring: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < ring.length - 1; i += 1) sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return Math.abs(sum) / 2
}

/**
 * The polygon as stored, or a message saying what's wrong with it. Accepts a GeoJSON Polygon or a bare
 * ring of [lng, lat] positions; closes the ring if needed.
 */
export function validateZonePolygon(raw: unknown): { polygon: ZonePolygon } | { error: string } {
  const value = raw as { type?: unknown; coordinates?: unknown } | unknown[]
  const ringRaw = Array.isArray(value) ? value : value && (value as { type?: unknown }).type === 'Polygon' ? ((value as { coordinates?: unknown[] }).coordinates ?? [])[0] : null
  if (!Array.isArray(ringRaw)) return { error: 'Draw the zone as an area on the map.' }
  const ring: Point[] = []
  for (const position of ringRaw) {
    if (!Array.isArray(position) || position.length < 2) return { error: 'The zone has an invalid point.' }
    const [lng, lat] = position.map(Number)
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return { error: 'The zone has a point outside the map.' }
    }
    ring.push([lng, lat])
  }
  const first = ring[0]
  const last = ring.at(-1)
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) ring.push([first[0], first[1]])
  if (ring.length < 4) return { error: 'A zone needs at least three corners.' }
  if (ring.length - 1 > MAX_VERTICES) return { error: `A zone can have at most ${MAX_VERTICES} corners.` }
  // Edges that cross make an area nobody can reason about ("bow tie" shapes).
  for (let i = 0; i < ring.length - 1; i += 1) {
    for (let j = i + 1; j < ring.length - 1; j += 1) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === ring.length - 2)) continue
      if (segmentsCross(ring[i], ring[i + 1], ring[j], ring[j + 1])) return { error: 'The zone’s edges cross. Move a corner so the outline doesn’t overlap itself.' }
    }
  }
  if (ringArea(ring) < 1e-7) return { error: 'The zone is too small to deliver to.' }
  return { polygon: { type: 'Polygon', coordinates: [ring.map(([lng, lat]) => [lng, lat] as [number, number])] } }
}
