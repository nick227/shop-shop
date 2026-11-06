export interface GeoPoint {
  readonly latitude: number
  readonly longitude: number
}

/** Austin, the default market, used only when the page has no place of its own. */
export const DEFAULT_CENTER: GeoPoint = { latitude: 30.2672, longitude: -97.7431 }
const DEFAULT_RADIUS_MILES = 25

export function validCoordinate(point: { readonly latitude?: unknown; readonly longitude?: unknown } | undefined): point is GeoPoint {
  if (!point) return false
  const { latitude, longitude } = point
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false
  // 0,0 is a missing geocode, not a shop in the Gulf of Guinea.
  return !(latitude === 0 && longitude === 0)
}

export function milesBetween(a: GeoPoint, b: GeoPoint): number {
  const rad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * rad
  const dLng = (b.longitude - a.longitude) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * What the map shows and how it frames it. Pins with broken coordinates are dropped, and only
 * pins near the page's place are drawn, so a missing location never zooms out to a continent.
 */
export function mapFrame<T extends { readonly latitude: number; readonly longitude: number }>(input: {
  readonly points: readonly T[]
  readonly center?: Partial<GeoPoint>
  readonly radiusMiles?: number
}): {
  readonly anchor: GeoPoint
  readonly hasPlace: boolean
  readonly pins: readonly T[]
  readonly view: { readonly kind: 'fit'; readonly bounds: readonly GeoPoint[] } | { readonly kind: 'center'; readonly at: GeoPoint; readonly zoom: number }
} {
  const hasPlace = validCoordinate(input.center)
  const anchor = hasPlace ? (input.center as GeoPoint) : DEFAULT_CENTER
  const radius = Math.max(input.radiusMiles && input.radiusMiles > 0 ? input.radiusMiles : DEFAULT_RADIUS_MILES, 5)
  const pins = input.points.filter((point) => validCoordinate(point) && milesBetween(anchor, point) <= radius)
  if (pins.length === 0) return { anchor, hasPlace, pins, view: { kind: 'center', at: anchor, zoom: hasPlace ? 13 : 11 } }
  if (pins.length === 1 && !hasPlace) return { anchor, hasPlace, pins, view: { kind: 'center', at: pins[0]!, zoom: 14 } }
  return { anchor, hasPlace, pins, view: { kind: 'fit', bounds: hasPlace ? [anchor, ...pins] : pins } }
}
