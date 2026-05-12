import type { StoreResponse, StoreWithRating } from '@api/types'

export type StoreHeaderTag = {
  readonly slug: string
  readonly label: string
  readonly category: string
}

/** Optional relations / client fields sometimes merged onto store payloads */
type StoreHeaderExtras = {
  readonly imageUrl?: string
  readonly mediaAssets?: { readonly url: string; readonly kind: string }[]
  readonly tags?: readonly StoreHeaderTag[]
  readonly storeType?: string | null
  readonly priceRange?: string | null
  /** Optional discoverability string (comma-separated) or list from API */
  readonly searchKeywords?: readonly string[] | string | null
}

export type StoreHeaderStore = StoreResponse & StoreWithRating & StoreHeaderExtras
