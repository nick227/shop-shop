/**
 * Order alert preferences, per store and per device. Sound comes from the device in the kitchen,
 * not the account, so these live in this browser's storage.
 *
 * A store without a saved choice alerts only while it is the store you're working in;
 * other stores stay silent until you turn them on.
 */
import { useCallback, useSyncExternalStore } from 'react'

export interface OrderAlertChoice {
  readonly sound: boolean
  readonly desktop: boolean
}

type SavedChoices = Readonly<Record<string, OrderAlertChoice>>

const STORAGE_KEY = 'vendor:orderAlerts'
const CHANGE_EVENT = 'vendor:orderAlerts-change'
const EMPTY: SavedChoices = {}

let cachedRaw: string | null = null
let cachedChoices: SavedChoices = EMPTY

function readChoices(): SavedChoices {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY
  }
  if (raw === cachedRaw) return cachedChoices
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    cachedChoices = parsed && typeof parsed === 'object' ? (parsed as SavedChoices) : EMPTY
  } catch {
    cachedChoices = EMPTY
  }
  return cachedChoices
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** The effective choice for a store: the saved one, or on only for the store you're working in. */
export function resolveOrderAlertChoice(choices: SavedChoices, storeId: string, activeStoreId: string): OrderAlertChoice {
  const isActive = storeId === activeStoreId
  return choices[storeId] ?? { sound: isActive, desktop: isActive }
}

export function readOrderAlertChoice(storeId: string, activeStoreId: string): OrderAlertChoice {
  return resolveOrderAlertChoice(readChoices(), storeId, activeStoreId)
}

export function useOrderAlertPrefs(activeStoreId: string) {
  const choices = useSyncExternalStore(subscribe, readChoices, () => EMPTY)

  const choiceFor = useCallback(
    (storeId: string) => resolveOrderAlertChoice(choices, storeId, activeStoreId),
    [choices, activeStoreId],
  )

  const setChoice = useCallback(
    (storeId: string, change: Partial<OrderAlertChoice>) => {
      const next = { ...readChoices(), [storeId]: { ...resolveOrderAlertChoice(readChoices(), storeId, activeStoreId), ...change } }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage blocked; the choice can't be kept on this device.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT))
    },
    [activeStoreId],
  )

  return { choiceFor, setChoice }
}
