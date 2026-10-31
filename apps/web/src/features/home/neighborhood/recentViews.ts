import { useSyncExternalStore } from 'react'

const KEY = 'shopshop.home.recent'
const LIMIT = 12

export interface RecentView {
  readonly id: string
  readonly kind: 'item' | 'store'
  readonly title: string
  readonly imageUrl?: string
  readonly subtitle?: string
  readonly path: string
}

let recent: readonly RecentView[] = readStored()
const listeners = new Set<() => void>()

function readStored(): readonly RecentView[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentView[]
    return Array.isArray(parsed) ? parsed.filter((view) => view.id && view.path && view.title) : []
  } catch {
    return []
  }
}

function save(next: readonly RecentView[]) {
  recent = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRecentViews(): readonly RecentView[] {
  return useSyncExternalStore(subscribe, () => recent, () => [])
}

export function recordRecent(view: RecentView) {
  const current = recent[0]
  if (
    current?.kind === view.kind
    && current.id === view.id
    && current.imageUrl === view.imageUrl
    && current.subtitle === view.subtitle
  ) return
  const rest = recent.filter((item) => item.kind !== view.kind || item.id !== view.id)
  save([view, ...rest].slice(0, LIMIT))
}
