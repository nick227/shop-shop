/**
 * Reorders an already-ranked river candidate list to reduce same-store / same-package
 * clustering without changing which posts exist (feed-layer only).
 */

export interface RiverFeedDiversifyCandidate {
  readonly id: string
  readonly storeId: string
  readonly contentType: string | null
  readonly packageId: string | null
  readonly duplicateKey: string | null
}

export interface DiversifyRiverFeedOptions {
  /** If true, disallow same storeId as the immediate previous item. */
  readonly avoidBackToBackStore: boolean
  readonly softWindowSize: number
  readonly maxPerStorePerWindow: number
  readonly duplicateKeyLookback: number
}

export const DEFAULT_DIVERSIFY_OPTIONS: DiversifyRiverFeedOptions = {
  avoidBackToBackStore: true,
  softWindowSize: 6,
  maxPerStorePerWindow: 2,
  duplicateKeyLookback: 10,
}

export function diversifyRiverFeedCandidates(
  ordered: readonly RiverFeedDiversifyCandidate[],
  options: Partial<DiversifyRiverFeedOptions> = {},
): RiverFeedDiversifyCandidate[] {
  if (ordered.length <= 1) {
    return [...ordered]
  }

  const opts = { ...DEFAULT_DIVERSIFY_OPTIONS, ...options }
  const result: RiverFeedDiversifyCandidate[] = []
  const remaining = [...ordered]

  while (remaining.length > 0) {
    const pickedIndex = remaining.findIndex((post) => {
      const last = result[result.length - 1]
      if (opts.avoidBackToBackStore && last && post.storeId === last.storeId) {
        return false
      }

      const recent = result.slice(-opts.softWindowSize)
      const recentSameStoreCount = recent.filter((p) => p.storeId === post.storeId).length
      if (recentSameStoreCount >= opts.maxPerStorePerWindow) {
        return false
      }

      if (post.packageId) {
        const recentSamePackage = recent.some((p) => p.packageId && p.packageId === post.packageId)
        if (recentSamePackage) {
          return false
        }
      }

      if (post.duplicateKey) {
        const dupRecent = result.slice(-opts.duplicateKeyLookback)
        const dupHit = dupRecent.some((p) => p.duplicateKey && p.duplicateKey === post.duplicateKey)
        if (dupHit) {
          return false
        }
      }

      const key = post.contentType ?? '__none__'
      const tail = result.slice(-2)
      if (
        tail.length === 2 &&
        (tail[0].contentType ?? '__none__') === key &&
        (tail[1].contentType ?? '__none__') === key
      ) {
        return false
      }

      return true
    })

    if (pickedIndex === -1) {
      result.push(remaining.shift()!)
    } else {
      result.push(...remaining.splice(pickedIndex, 1))
    }
  }

  return result
}

/** Stats for tuning / optional debug logging */
export function riverFeedDiversityStats(ordered: readonly RiverFeedDiversifyCandidate[]): {
  uniqueStores: number
  maxSameStoreRun: number
  contentTypeHistogram: Record<string, number>
} {
  const stores = ordered.map((p) => p.storeId).filter(Boolean)
  const uniqueStores = new Set(stores).size

  let maxSameStoreRun = 0
  let run = 0
  let prev: string | undefined
  for (const id of stores) {
    if (id === prev) {
      run += 1
    } else {
      run = 1
      prev = id
    }
    if (run > maxSameStoreRun) maxSameStoreRun = run
  }

  const contentTypeHistogram: Record<string, number> = {}
  for (const p of ordered) {
    const k = p.contentType ?? 'unknown'
    contentTypeHistogram[k] = (contentTypeHistogram[k] ?? 0) + 1
  }

  return { uniqueStores, maxSameStoreRun, contentTypeHistogram }
}
