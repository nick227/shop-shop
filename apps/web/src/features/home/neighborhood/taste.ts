import { useSyncExternalStore } from 'react'

const KEY = 'shopshop.home.taste'

export interface HomeTaste {
  readonly weights: Readonly<Record<string, number>>
  readonly muted: readonly string[]
}

const EMPTY: HomeTaste = { weights: {}, muted: [] }

let taste: HomeTaste = readStored()
const listeners = new Set<() => void>()

function readStored(): HomeTaste {
  if (typeof localStorage === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<HomeTaste>
    return {
      weights: parsed.weights ?? {},
      muted: parsed.muted ?? [],
    }
  } catch {
    return EMPTY
  }
}

function save(next: HomeTaste) {
  taste = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useHomeTaste(): HomeTaste {
  return useSyncExternalStore(subscribe, () => taste, () => EMPTY)
}

export function recordVertical(slug: string) {
  const weights = { ...taste.weights, [slug]: (taste.weights[slug] ?? 0) + 1 }
  save({ weights, muted: taste.muted.filter((item) => item !== slug) })
}

export function hideVertical(slug: string) {
  if (taste.muted.includes(slug)) return
  save({ weights: taste.weights, muted: [...taste.muted, slug] })
}

export function resetHomeTaste() {
  save(EMPTY)
}

/** Two opens is enough to surface a vertical. A single glance is not. */
export function preferredSlug(current: HomeTaste): string | undefined {
  let best: string | undefined
  let score = 1
  for (const [slug, weight] of Object.entries(current.weights)) {
    if (current.muted.includes(slug)) continue
    if (weight > score) {
      score = weight
      best = slug
    }
  }
  return best
}
