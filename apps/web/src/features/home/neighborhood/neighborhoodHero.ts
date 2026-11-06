import { shopsNearLabel } from './discoveryLocated'

export type NeighborhoodCard = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly headline: string | null
  readonly about: string | null
  readonly coverUrl: string | null
}

/** A ZIP introduces neighborhoods in the area. It does not decide which one the shopper is in. */
export function homepageTitle(city: string, state: string, _neighborhoods: readonly NeighborhoodCard[]): string {
  return shopsNearLabel(city, state)
}

export function neighborhoodPath(slug: string, search = ''): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  for (const key of ['zip', 'radius', 'neighborhood', 'browse', 'group', 'lat', 'lng', 'city', 'state']) params.delete(key)
  const rest = params.toString()
  return `/neighborhoods/${slug}${rest ? `?${rest}` : ''}`
}
