const KEY = 'shopshop.home.place'

/** Metro-sized range for the home delivery area. Shoppers do not pick a radius. */
export const HOME_RADIUS_MILES = 25

export function rememberPlace(search: string): void {
  const value = search.startsWith('?') ? search.slice(1) : search
  if (!new URLSearchParams(value).get('zip')) return
  sessionStorage.setItem(KEY, value)
}

export function rememberedPlace(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

/** ZIP the header shows: the current URL, otherwise the last place the shopper set. */
export function placeZip(search: string): string {
  const value = search.startsWith('?') ? search.slice(1) : search
  return new URLSearchParams(value).get('zip') ?? new URLSearchParams(rememberedPlace()).get('zip') ?? ''
}

export function placeTarget(
  pathname: string,
  currentSearch: string,
): { pathname: string; search: string } {
  const current = new URLSearchParams(currentSearch)
  if (current.get('zip')) return { pathname, search: current.toString() }
  return { pathname, search: rememberedPlace() }
}
