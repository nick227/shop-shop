const KEY = 'shopshop.home.place'
const LEGACY_LOCATION_KEY = 'current_location'

/** Metro-sized range for the home delivery area. Shoppers do not pick a radius. */
export const HOME_RADIUS_MILES = 25

export const DEFAULT_STORE_IMAGE = '/logo.png'

function validZip(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && /^\d{5}$/.test(trimmed) ? trimmed : undefined
}

export function rememberPlace(search: string): void {
  const value = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(value)
  const zip = validZip(params.get('zip'))
  if (!zip) return
  const clean = new URLSearchParams()
  clean.set('zip', zip)
  clean.set('radius', params.get('radius') || String(HOME_RADIUS_MILES))
  const serialized = clean.toString()
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, serialized)
  } catch {
    // ignore storage errors
  }
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(KEY, serialized)
  } catch {
    // ignore storage errors
  }
}

export function rememberZip(zip: string): void {
  const clean = validZip(zip)
  if (!clean) return
  rememberPlace(`zip=${clean}&radius=${HOME_RADIUS_MILES}`)
}

function readStoredPlace(storage: Storage | undefined): string | undefined {
  if (!storage) return undefined
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return undefined
    const zip = validZip(new URLSearchParams(raw).get('zip'))
    if (!zip) return undefined
    return raw
  } catch {
    return undefined
  }
}

function readLegacyLocationPlace(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(LEGACY_LOCATION_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as { zip?: string }
    const zip = validZip(parsed?.zip)
    return zip ? `zip=${zip}&radius=${HOME_RADIUS_MILES}` : undefined
  } catch {
    return undefined
  }
}

export function rememberedPlace(): string {
  const fromLocal = readStoredPlace(typeof localStorage !== 'undefined' ? localStorage : undefined)
  if (fromLocal) return fromLocal
  const fromSession = readStoredPlace(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined)
  if (fromSession) {
    rememberPlace(fromSession)
    return fromSession
  }
  const fromLegacy = readLegacyLocationPlace()
  if (fromLegacy) {
    rememberPlace(fromLegacy)
    return fromLegacy
  }
  return ''
}

/** ZIP the header shows: the current URL, otherwise the last place the shopper set. */
export function placeZip(search: string): string {
  const value = search.startsWith('?') ? search.slice(1) : search
  return validZip(new URLSearchParams(value).get('zip')) ?? validZip(new URLSearchParams(rememberedPlace()).get('zip')) ?? ''
}

export function placeTarget(
  pathname: string,
  currentSearch: string,
): { pathname: string; search: string } {
  const current = new URLSearchParams(currentSearch)
  if (validZip(current.get('zip'))) return { pathname, search: current.toString() }
  return { pathname, search: rememberedPlace() }
}
