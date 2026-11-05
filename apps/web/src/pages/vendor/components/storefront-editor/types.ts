import type { ItemResponse } from '@api/types'
import type { StorefrontConfig } from '@packages/shared/storefront'
import type { StorefrontMedia } from '@features/storefront/api'
import type { StorefrontBundle } from '@features/storefront/components/Merchandising'

/** Mutable copy of the config the editor builds up; `update` receives the current draft. */
export type Draft = StorefrontConfig
export type Writable<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K] }

export interface PanelProps {
  readonly storeId: string
  readonly draft: Draft
  readonly update: (change: (draft: Draft) => Draft) => void
  /** Every item of the store that shoppers can see. */
  readonly items: readonly ItemResponse[]
  readonly media: readonly StorefrontMedia[]
  readonly bundles: readonly StorefrontBundle[]
  /** Call after uploading so the media library refreshes. */
  readonly onMediaChanged: () => void
}
