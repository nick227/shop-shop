export type LngLat = readonly [number, number]

export type GeoBox = {
  readonly south: number
  readonly west: number
  readonly north: number
  readonly east: number
}

export function ringCentroid(ring: readonly LngLat[]): { latitude: number; longitude: number } {
  let crossed = 0
  let cx = 0
  let cy = 0
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[index + 1]
    const cross = x1 * y2 - x2 * y1
    crossed += cross
    cx += (x1 + x2) * cross
    cy += (y1 + y2) * cross
  }
  if (crossed === 0) {
    const longitude = ring.reduce((sum, point) => sum + point[0], 0) / ring.length
    const latitude = ring.reduce((sum, point) => sum + point[1], 0) / ring.length
    return { latitude, longitude }
  }
  return { longitude: cx / (3 * crossed), latitude: cy / (3 * crossed) }
}

export function pointInRing(longitude: number, latitude: number, ring: readonly LngLat[]): boolean {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x1, y1] = ring[previous]
    const [x2, y2] = ring[index]
    const crosses = (y1 > latitude) !== (y2 > latitude)
    if (!crosses) continue
    const x = ((x2 - x1) * (latitude - y1)) / (y2 - y1) + x1
    if (longitude < x) inside = !inside
  }
  return inside
}

export function boxFromRings(rings: readonly (readonly LngLat[])[]): GeoBox {
  let south = Number.POSITIVE_INFINITY
  let north = Number.NEGATIVE_INFINITY
  let west = Number.POSITIVE_INFINITY
  let east = Number.NEGATIVE_INFINITY
  for (const ring of rings) {
    for (const [longitude, latitude] of ring) {
      if (latitude < south) south = latitude
      if (latitude > north) north = latitude
      if (longitude < west) west = longitude
      if (longitude > east) east = longitude
    }
  }
  return { south, west, north, east }
}

export function zipAt(longitude: number, latitude: number, areas: readonly { code: string; rings: readonly (readonly LngLat[])[] }[]): string | null {
  const area = areas.find((candidate) => candidate.rings.some((ring) => pointInRing(longitude, latitude, ring)))
  return area?.code ?? null
}

export function placeForZip(zip: string | null, neighborhoodIdsByZip: ReadonlyMap<string, readonly string[]>, cityId: string): string {
  if (!zip) return cityId
  const ids = neighborhoodIdsByZip.get(zip) ?? []
  return ids.length === 1 ? ids[0] : cityId
}
