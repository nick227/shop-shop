import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { RiverPost, StoreWithDistance } from '@api/types'
import { directoryQuery } from '../neighborhood/useDirectory'
import type { GuideListing } from '../neighborhood/useNeighborhoodGuide'
import { directoryGroup } from './discoveryContext'
import { discoveryResults } from './discoveryResults'
import type { DiscoveryItem } from './tiles'

/** A tag pinned to a place by an admin, as `/api/places/:slug` returns it. */
export interface NeighborhoodTag {
  readonly id: string
  readonly label: string
  readonly kind: 'EDITORIAL' | 'DISCOVERY'
  readonly categoryId: string | null
  readonly searchQuery: string | null
  readonly sortIndex: number
  readonly visible: boolean
}

/**
 * Automatic suggestions. Each one names its query outright; nothing is inferred from a label.
 * They only appear when their query returns results for the current place.
 */
export const SUGGESTED_TAGS: readonly { readonly label: string; readonly categoryId: string; readonly searchQuery?: string }[] = [
  { label: 'Food', categoryId: 'food' },
  { label: 'Coffee', categoryId: 'food', searchQuery: 'coffee' },
  { label: 'Shops', categoryId: 'retail' },
  { label: 'Grocery', categoryId: 'grocery' },
  { label: 'Arts', categoryId: 'arts' },
  { label: 'Outdoors', categoryId: 'outdoors' },
  { label: 'Convenience', categoryId: 'convenience' },
]

export const HERO_TAG_LIMIT = 6
const SUGGESTION_LIMIT = 5

export interface HeroTagCandidate {
  /** Unique per candidate; also the filter identity for discovery-backed tags. */
  readonly key: string
  readonly label: string
  readonly kind: 'EDITORIAL' | 'DISCOVERY'
  readonly category: string
  readonly q: string
  /** Has a query mapping, so it can filter the feed and map. */
  readonly filterable: boolean
  readonly pinned: boolean
}

export interface HeroTag extends HeroTagCandidate {
  readonly count?: number
}

export function tagFilterKey(category: string | null | undefined, q: string | null | undefined): string {
  return `${category ?? ''}|${(q ?? '').trim().toLowerCase()}`
}

/** Admin tags in their order, then suggestions the admin has not already pinned or hidden. */
export function heroTagCandidates(placeTags: readonly NeighborhoodTag[] | undefined): HeroTagCandidate[] {
  const tags = [...(placeTags ?? [])].sort((left, right) => left.sortIndex - right.sortIndex)
  const claimed = new Set<string>()
  const candidates: HeroTagCandidate[] = []
  for (const tag of tags) {
    const category = tag.categoryId ?? ''
    const q = tag.searchQuery?.trim() ?? ''
    const filterable = Boolean(category || q)
    const filter = tagFilterKey(category, q)
    if (filterable) claimed.add(filter)
    if (!tag.visible) continue
    candidates.push({
      key: filterable ? filter : `editorial:${tag.id}`,
      label: tag.label,
      kind: tag.kind,
      category,
      q,
      filterable,
      pinned: true,
    })
  }
  for (const suggestion of SUGGESTED_TAGS) {
    const filter = tagFilterKey(suggestion.categoryId, suggestion.searchQuery)
    if (claimed.has(filter)) continue
    claimed.add(filter)
    candidates.push({
      key: filter,
      label: suggestion.label,
      kind: 'DISCOVERY',
      category: suggestion.categoryId,
      q: suggestion.searchQuery ?? '',
      filterable: true,
      pinned: false,
    })
  }
  return dedupe(candidates)
}

function dedupe(candidates: HeroTagCandidate[]): HeroTagCandidate[] {
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    if (seen.has(candidate.key)) return false
    seen.add(candidate.key)
    return true
  })
}

/**
 * Keep pinned tags in admin order, then the strongest suggestions.
 * Any filter that leads nowhere is dropped, pinned or not.
 */
export function pickHeroTags(candidates: readonly HeroTagCandidate[], counts: ReadonlyMap<string, number>): HeroTag[] {
  const pinned: HeroTag[] = []
  const suggested: HeroTag[] = []
  for (const candidate of candidates) {
    if (!candidate.filterable) {
      pinned.push(candidate)
      continue
    }
    const count = counts.get(candidate.key)
    if (!count) continue
    const bucket = candidate.pinned ? pinned : suggested
    bucket.push({ ...candidate, count })
  }
  suggested.sort((left, right) => (right.count ?? 0) - (left.count ?? 0))
  return [...pinned, ...suggested.slice(0, SUGGESTION_LIMIT)].slice(0, HERO_TAG_LIMIT)
}

export function isActiveTag(tag: HeroTagCandidate, category: string, q: string): boolean {
  return tag.filterable && tagFilterKey(tag.category, tag.q) === tagFilterKey(category, q)
}

/**
 * Counts each candidate by running the request and pipeline the feed would run with that
 * filter applied. The requests share cache entries with the feed, so a click lands on loaded data.
 */
export function useHeroTags(input: {
  readonly enabled: boolean
  readonly placeTags: readonly NeighborhoodTag[] | undefined
  readonly latitude?: number
  readonly longitude?: number
  readonly radius?: number
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly DiscoveryItem[]
  readonly stories: readonly RiverPost[]
  readonly curated: readonly GuideListing[]
}): { readonly tags: readonly HeroTag[]; readonly settled: boolean } {
  const candidates = useMemo(() => (input.enabled ? heroTagCandidates(input.placeTags) : []), [input.enabled, input.placeTags])
  const filters = candidates.filter((candidate) => candidate.filterable)
  const results = useQueries({
    queries: filters.map((candidate) => ({
      ...directoryQuery(input.latitude, input.longitude, {
        q: candidate.q,
        group: directoryGroup(candidate.category),
        radius: input.radius,
      }),
      staleTime: 5 * 60 * 1000,
    })),
  })
  const settled = results.every((result) => !result.isPending)
  const dataStamp = results.map((result) => result.dataUpdatedAt).join(',')
  const { stores, products, stories, curated } = input
  const tags = useMemo(() => {
    if (!settled) return []
    const counts = new Map<string, number>()
    for (const [index, candidate] of filters.entries()) {
      counts.set(candidate.key, discoveryResults({
        stores,
        products,
        stories,
        directory: results[index]?.data ?? [],
        curated,
        browse: candidate.category,
        query: candidate.q,
      }).points.length)
    }
    return pickHeroTags(candidates, counts)
    // `results` is a new array each render; `dataStamp` tracks when its data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, curated, dataStamp, products, settled, stores, stories])
  return { tags, settled }
}
