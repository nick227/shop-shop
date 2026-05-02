/**
 * Pure helpers for resolving delivery coordinates from payloads / Address.geo JSON.
 */

export type CoordPair = Readonly<{ lat: number; lng: number }>

export function parseCoordPair(latIn: unknown, lngIn: unknown): CoordPair | undefined {
  const lat = typeof latIn === 'number' ? latIn : latIn !== undefined && latIn !== null ? Number(latIn) : NaN
  const lng = typeof lngIn === 'number' ? lngIn : lngIn !== undefined && lngIn !== null ? Number(lngIn) : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined
  return { lat, lng }
}

export function parseGeoJson(geo: unknown): CoordPair | undefined {
  if (!geo || typeof geo !== 'object') return undefined
  const g = geo as Record<string, unknown>
  return parseCoordPair(g.latitude ?? g.lat, g.longitude ?? g.lng)
}
