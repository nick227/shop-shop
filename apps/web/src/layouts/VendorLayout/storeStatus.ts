import type { StatusTone } from '@shared/ui/primitives/ui/StatusPill'
import type { StoreResponse } from '@api/types'

export interface StoreStatus {
  readonly label: 'Open' | 'Paused' | 'On hold' | 'Hidden' | 'Draft'
  readonly tone: StatusTone
}

type StatusFields = Pick<StoreResponse, 'status' | 'isPublished'> & { readonly acceptingOrders?: boolean }

/**
 * Restrictions the merchant can't lift (Hidden, On hold) come first; Paused is the merchant's own switch.
 * The labels say what the store can't do, not who did it.
 */
export function storeStatus(store: StatusFields): StoreStatus {
  if (store.status === 'DISABLED') return { label: 'Hidden', tone: 'danger' }
  if (store.status === 'PAUSED') return { label: 'On hold', tone: 'danger' }
  if (!store.isPublished) return { label: 'Draft', tone: 'neutral' }
  if (store.acceptingOrders === false) return { label: 'Paused', tone: 'warning' }
  return { label: 'Open', tone: 'live' }
}

export function storePlace(store: Pick<StoreResponse, 'addressCity' | 'addressState'>): string {
  return [store.addressCity, store.addressState].filter(Boolean).join(', ')
}
