import type { StatusTone } from '@shared/ui/primitives/ui/StatusPill'
import type { StoreResponse } from '@api/types'

export interface StoreStatus {
  readonly label: 'Open' | 'Paused' | 'Suspended' | 'Disabled' | 'Draft'
  readonly tone: StatusTone
}

type StatusFields = Pick<StoreResponse, 'status' | 'isPublished'> & { readonly acceptingOrders?: boolean }

/**
 * Administrative restrictions (Disabled, Suspended) come first because the merchant can't lift them;
 * Paused is the merchant's own switch.
 */
export function storeStatus(store: StatusFields): StoreStatus {
  if (store.status === 'DISABLED') return { label: 'Disabled', tone: 'danger' }
  if (store.status === 'PAUSED') return { label: 'Suspended', tone: 'danger' }
  if (!store.isPublished) return { label: 'Draft', tone: 'neutral' }
  if (store.acceptingOrders === false) return { label: 'Paused', tone: 'warning' }
  return { label: 'Open', tone: 'live' }
}

export function storePlace(store: Pick<StoreResponse, 'addressCity' | 'addressState'>): string {
  return [store.addressCity, store.addressState].filter(Boolean).join(', ')
}
