/* eslint-disable react-refresh/only-export-components -- provider + hook belong together */
/**
 * What every storefront part needs: the store, whether this is the live page or the vendor's preview,
 * and the shopper actions (open an item, add to cart). The preview shows everything but adds nothing.
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import type { ItemResponse } from '@api/types'

export type StorefrontMode = 'live' | 'preview'

export interface StorefrontStore {
  readonly id: string
  readonly name: string
}

export interface StorefrontActions {
  readonly store: StorefrontStore
  readonly mode: StorefrontMode
  /** False when checkout would refuse a new order; adding stays possible for later, buying does not. */
  readonly acceptingOrders: boolean
  readonly openItem: (item: ItemResponse) => void
  readonly addItem: (item: ItemResponse, quantity?: number) => void
  /** Distance from the top of the scrolling area to where sticky bars should sit. */
  readonly stickyTop: number
  /** The scrolling element in the preview; the window on the live page. */
  readonly scrollRoot: HTMLElement | null
  /** Brand theme, for parts rendered outside the storefront root (dialogs portal to the body). */
  readonly theme: { readonly className: string; readonly style: CSSProperties }
}

const StorefrontContext = createContext<StorefrontActions | undefined>(undefined)

export function StorefrontProvider({ value, children }: { readonly value: StorefrontActions; readonly children: ReactNode }) {
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export function useStorefrontActions(): StorefrontActions {
  const value = useContext(StorefrontContext)
  if (!value) throw new Error('useStorefrontActions must be used inside a StorefrontProvider')
  return value
}

export const canOrderItem = (item: ItemResponse) => item.isActive !== false && !item.isSoldOut
