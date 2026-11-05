/**
 * Every seller URL. Store pages live under `/vendor/:storeId`; the store comes from the path only.
 */
const store = (storeId: string, rest = '') => `/vendor/${storeId}${rest}`

/** Store settings are a section of the Overview; this is its element id. */
export const STORE_SETTINGS_ANCHOR = 'settings'

export const vendorPaths = {
  allStores: '/vendor/stores',
  newStore: '/vendor/new',
  overview: (storeId: string) => store(storeId),
  orders: (storeId: string) => store(storeId, '/orders'),
  menu: (storeId: string) => store(storeId, '/menu'),
  storefront: (storeId: string) => store(storeId, '/storefront'),
  newItem: (storeId: string) => store(storeId, '/menu/items/new'),
  item: (storeId: string, itemId: string) => store(storeId, `/menu/items/${itemId}`),
  bundles: (storeId: string) => store(storeId, '/menu/bundles'),
  newBundle: (storeId: string) => store(storeId, '/menu/bundles/new'),
  bundle: (storeId: string, bundleId: string) => store(storeId, `/menu/bundles/${bundleId}`),
  river: (storeId: string) => store(storeId, '/river'),
  affiliates: (storeId: string) => store(storeId, '/affiliates'),
  team: (storeId: string) => store(storeId, '/team'),
  drivers: (storeId: string) => store(storeId, '/team/drivers'),
  settings: (storeId: string, tab?: string) => store(storeId, `${tab ? `?tab=${tab}` : ''}#${STORE_SETTINGS_ANCHOR}`),
} as const

/** First path segments under /vendor that are not store ids. */
export const RESERVED_VENDOR_SEGMENTS: ReadonlySet<string> = new Set([
  'stores',
  'store',
  'new',
  'dashboard',
  'orders',
  'affiliates',
  'team',
  'drivers',
  'apply',
  'application-status',
  'onboarding',
])

/** The store id in a `/vendor/:storeId/...` pathname, if the first segment is one. */
export function storeIdFromPath(pathname: string): string {
  const segment = /^\/vendor\/([^/]+)/.exec(pathname)?.[1] ?? ''
  return segment && !RESERVED_VENDOR_SEGMENTS.has(segment) ? decodeURIComponent(segment) : ''
}

/** Same page, another store: swaps the store segment of a store path. */
export function withStore(pathname: string, storeId: string): string {
  return pathname.replace(/^\/vendor\/[^/]+/, `/vendor/${storeId}`)
}
