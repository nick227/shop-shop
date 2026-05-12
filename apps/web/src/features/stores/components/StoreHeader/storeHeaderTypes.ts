import type { StoreResponse, StoreWithRating } from '@api/types'

/** Optional relations / client fields sometimes merged onto store payloads */
type StoreHeaderExtras = {
  readonly imageUrl?: string
  readonly mediaAssets?: { readonly url: string; readonly kind: string }[]
}

export type StoreHeaderStore = StoreResponse & StoreWithRating & StoreHeaderExtras
