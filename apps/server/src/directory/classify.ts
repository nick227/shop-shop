import { haversineMiles } from '@packages/db'
import type { ImportDecision, KnownListing, KnownStore, ListingCandidate } from './types.js'

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

function samePlace(name: string, latitude: number | null, longitude: number | null, knownName: string, knownLat: number | null, knownLng: number | null): boolean {
  if (normalizeName(name) !== normalizeName(knownName)) return false
  if (latitude == null || longitude == null || knownLat == null || knownLng == null) return false
  return haversineMiles({ latitude, longitude }, { latitude: knownLat, longitude: knownLng }) < 0.1
}

export function classifyName(
  submitted: string,
  found: readonly ListingCandidate[],
  listings: readonly KnownListing[],
  stores: readonly KnownStore[],
): ImportDecision {
  const needle = normalizeName(submitted)
  const exact = found.filter((candidate) => normalizeName(candidate.name) === needle)
  const partial = exact.length > 0 ? exact : found.filter((candidate) => {
    const name = normalizeName(candidate.name)
    return needle.length >= 4 && (name.includes(needle) || needle.includes(name))
  })
  const open = partial.filter((candidate) => !listings.some((row) => row.sourceId === candidate.sourceId || samePlace(candidate.name, candidate.latitude, candidate.longitude, row.name, row.latitude, row.longitude)))
  const taken = partial.filter((candidate) => !open.includes(candidate))
  if (partial.length === 0) return { status: 'NOT_FOUND', candidates: [], selectedSourceId: null, storeId: null }
  if (open.length === 0) return { status: 'EXISTING', candidates: taken, selectedSourceId: taken[0]?.sourceId ?? null, storeId: null }
  const merchant = stores.find((store) => open.some((candidate) => samePlace(candidate.name, candidate.latitude, candidate.longitude, store.name, store.latitude, store.longitude)))
  if (merchant) return { status: 'EXISTING', candidates: open, selectedSourceId: open[0]?.sourceId ?? null, storeId: merchant.id }
  if (exact.length === 1 && open.length === 1 && open[0]?.street) {
    return { status: 'READY', candidates: open, selectedSourceId: open[0].sourceId, storeId: null }
  }
  return { status: 'REVIEW', candidates: open.length > 0 ? open : partial, selectedSourceId: null, storeId: null }
}
