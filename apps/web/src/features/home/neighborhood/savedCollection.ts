import { useSyncExternalStore } from 'react'
import { authFetch } from '@shared/lib/auth/authFetch'
import { useAuthStore } from '@stores/authStore'

const KEY = 'shopshop.home.collection'
const LIMIT = 24

export interface CollectionEntry {
  readonly id: string
  readonly kind: 'item' | 'store'
  readonly title: string
  readonly subtitle?: string
  readonly imageUrl?: string
  readonly path: string
}

let collection: readonly CollectionEntry[] = readStored()
const listeners = new Set<() => void>()

function readStored(): readonly CollectionEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CollectionEntry[]
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry && entry.id && entry.kind && entry.title && entry.path)
      : []
  } catch {
    return []
  }
}

function save(next: readonly CollectionEntry[]) {
  collection = next
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(next))
    }
  } catch {
    // ignore storage errors
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSavedCollection(): readonly CollectionEntry[] {
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(KEY) && collection.length > 0) {
    collection = []
  }
  return useSyncExternalStore(subscribe, () => collection, () => [])
}

export function isInCollection(kind: 'item' | 'store', id: string): boolean {
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(KEY) && collection.length > 0) {
    collection = []
  }
  return collection.some((entry) => entry.kind === kind && entry.id === id)
}

export function toggleSavedCollection(entry: CollectionEntry): boolean {
  const exists = isInCollection(entry.kind, entry.id)
  if (exists) {
    save(collection.filter((item) => !(item.kind === entry.kind && item.id === entry.id)))
  } else {
    const rest = collection.filter((item) => !(item.kind === entry.kind && item.id === entry.id))
    save([entry, ...rest].slice(0, LIMIT))
  }

  const authed = useAuthStore.getState().isAuthenticated
  if (authed) {
    const endpoint = entry.kind === 'item'
      ? (exists ? `api/favorites/items/${entry.id}` : 'api/favorites/items')
      : (exists ? `api/favorites/stores/${entry.id}` : 'api/favorites/stores')
    const body = entry.kind === 'item' ? { itemId: entry.id } : { storeId: entry.id }
    void authFetch(endpoint, {
      method: exists ? 'DELETE' : 'POST',
      ...(exists ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
    }).catch(() => undefined)
  }

  return !exists
}

