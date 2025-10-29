/**
 * Resource API Shims
 * Minimal REST adapters used by generated hooks.
 * These avoid coupling to the SDK and keep types local.
 */

import type {
  StoreResponse,
  ItemResponse,
  CartWithTotals,
  OrderResponse,
  AddressResponse,
  Bundle
} from './backend-types'

const API_BASE = (typeof window !== 'undefined' && (window as any).__API_BASE__) || ''

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed: ' + res.status + ' ' + url)
  return res.json() as Promise<T>
}

export const stores = {
  list: (params?: Record<string, unknown>) => getJson<StoreResponse[]>(API_BASE + '/stores'),
  getById: (id: string) => getJson<StoreResponse>(API_BASE + '/stores/' + id)
}

export const items = {
  list: (params?: Record<string, unknown>) => getJson<ItemResponse[]>(API_BASE + '/items'),
  getById: (id: string) => getJson<ItemResponse>(API_BASE + '/items/' + id)
}

export const carts = {
  list: (params?: Record<string, unknown>) => getJson<CartWithTotals[]>(API_BASE + '/carts'),
  getById: (id: string) => getJson<CartWithTotals>(API_BASE + '/carts/' + id)
}

export const orders = {
  list: (params?: Record<string, unknown>) => getJson<OrderResponse[]>(API_BASE + '/orders'),
  getById: (id: string) => getJson<OrderResponse>(API_BASE + '/orders/' + id)
}

export const addresses = {
  list: (params?: Record<string, unknown>) => getJson<AddressResponse[]>(API_BASE + '/addresses'),
  getById: (id: string) => getJson<AddressResponse>(API_BASE + '/addresses/' + id)
}

export const bundles = {
  list: (params?: Record<string, unknown>) => getJson<Bundle[]>(API_BASE + '/bundles'),
  getById: (id: string) => getJson<Bundle>(API_BASE + '/bundles/' + id)
}


