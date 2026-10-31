const KEY = 'shopshop.home.place'

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

export function placeTarget(
  pathname: string,
  currentSearch: string,
): { pathname: string; search: string } {
  const current = new URLSearchParams(currentSearch)
  if (current.get('zip')) return { pathname, search: current.toString() }
  return { pathname, search: rememberedPlace() }
}
