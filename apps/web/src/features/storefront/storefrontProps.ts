/**
 * Inputs for the one storefront page. The live shop, the vendor preview, and a directory profile
 * all pass these. `commerce` turns ordering off without a second layout.
 */
import type { ReactNode } from 'react'
import type { ItemResponse } from '@api/types'
import type { StorefrontConfig, StorefrontSection } from '@packages/shared/storefront'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import type { MenuSection } from '@shared/lib/menu/menuSections'
import type { StorefrontData } from './api'
import type { StorefrontMode } from './context'
import type { StorefrontBundle } from './components/Merchandising'

/** Header and ordering stay put. `StorefrontSection` is the list a config can hide. */
export type StorefrontPartKey = 'header' | 'ordering' | StorefrontSection

export interface StorefrontProps {
  readonly store: StoreHeaderStore
  readonly data: StorefrontData
  /** The config to render. The editor passes the draft. Defaults to `data.config`. */
  readonly config?: StorefrontConfig
  /** Items shoppers may see. */
  readonly items: readonly ItemResponse[]
  readonly sections: readonly MenuSection[]
  readonly bundles: readonly StorefrontBundle[]
  readonly mode: StorefrontMode
  readonly stickyTop: number
  readonly scrollRoot?: HTMLElement | null
  /** The store's updates feed. Live page only. */
  readonly updates?: ReactNode
  /** Editor only: an Edit button calls this with the part's key. */
  readonly onEditSection?: (key: StorefrontPartKey) => void
  /** Editor only: the part to outline. */
  readonly highlight?: StorefrontPartKey | null
  /** Editor only: show or hide an optional section from the preview. */
  readonly onToggleSection?: (key: Exclude<StorefrontSection, 'menu'>, visible: boolean) => void
  /** False for a directory profile: same page, without ordering, a menu, or a cart. */
  readonly commerce?: boolean
  readonly className?: string
}
