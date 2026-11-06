import { isDiscoveryPath } from '@features/home/discovery/discoveryContext'

/** Only local discovery destinations can be carried across public business pages. */
export function discoveryReturn(search: string): string | undefined {
  const value = new URLSearchParams(search).get('from')
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return
  const url = new URL(value, 'https://shop.invalid')
  if (url.origin !== 'https://shop.invalid' || !isDiscoveryPath(url.pathname)) return
  return url.pathname + url.search + url.hash
}

export function withDiscoveryOrigin(destination: string, pathname: string, search: string, hash = ''): string {
  if (!/^\/(kitchen|directory|items)\/[^/?#]+/.test(destination)) return destination
  const origin = isDiscoveryPath(pathname) ? pathname + search + hash : discoveryReturn(search)
  if (!origin) return destination
  const url = new URL(destination, 'https://shop.invalid')
  url.searchParams.set('from', origin)
  return url.pathname + url.search + url.hash
}

export type DiscoveryVisit = { y: number; selected?: string; href?: string; count?: number }
export function readVisit(url: string): DiscoveryVisit | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(`discovery-visit:${url}`) || 'null')
    return value && Number.isFinite(value.y) && value.y >= 0 ? value : undefined
  } catch { return undefined }
}
export function saveVisit(url: string, visit: Partial<DiscoveryVisit>) {
  try { sessionStorage.setItem(`discovery-visit:${url}`, JSON.stringify({ y: 0, ...readVisit(url), ...visit })) } catch { /* Storage is optional. */ }
}
