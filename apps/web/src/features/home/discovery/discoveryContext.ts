const CATEGORIES = new Set(['food', 'grocery', 'convenience', 'retail', 'arts', 'outdoors'])

export type DiscoveryView = 'feed' | 'map'

export type DiscoveryContext = {
  readonly zip?: string
  readonly category: string
  readonly neighborhood?: string
  readonly city?: string
  readonly q: string
  readonly view: DiscoveryView
  readonly hasExplicitPlace: boolean
}

export type DiscoveryPatch = {
  readonly zip?: string | null
  readonly category?: string | null
  readonly neighborhood?: string | null
  readonly city?: string | null
  readonly q?: string | null
  readonly view?: DiscoveryView | null
  readonly listNeighborhoods?: boolean
}

function validZip(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && /^\d{5}$/.test(trimmed) ? trimmed : undefined
}

function cleanCategory(value: string | null | undefined): string {
  const trimmed = value?.trim().toLowerCase() ?? ''
  return CATEGORIES.has(trimmed) ? trimmed : ''
}

export function isDiscoveryPath(pathname: string): boolean {
  return pathname === '/explore' || pathname === '/neighborhoods' || /^\/neighborhoods\/[^/]+$/.test(pathname)
}

export function neighborhoodSlugFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/neighborhoods\/([^/]+)$/)
  return match?.[1]
}

export function readDiscoveryContext(pathname: string, search: string): DiscoveryContext {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const zip = validZip(params.get('zip'))
  const neighborhood = neighborhoodSlugFromPath(pathname) || params.get('neighborhood')?.trim() || undefined
  const city = params.get('city')?.trim() || undefined
  const category = cleanCategory(params.get('category') || params.get('browse') || params.get('group'))
  const q = params.get('q') ?? ''
  const view: DiscoveryView = params.get('view') === 'map' ? 'map' : 'feed'
  return {
    zip,
    category,
    neighborhood,
    city,
    q,
    view,
    hasExplicitPlace: Boolean(zip || neighborhood || city || (params.has('lat') && params.has('lng')) || pathname === '/neighborhoods'),
  }
}

export function directoryGroup(category: string): string {
  if (category === 'arts' || category === 'outdoors') return 'out'
  return category
}

/** Drop legacy category params. Returns the search string when it changed. */
export function canonicalDiscoverySearch(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const category = cleanCategory(params.get('category'))
  const alias = cleanCategory(params.get('browse') || params.get('group'))
  if (!category && alias) params.set('category', alias)
  params.delete('browse')
  params.delete('group')
  return params.toString()
}

export function applyDiscoveryPatch(
  pathname: string,
  search: string,
  patch: DiscoveryPatch,
): { pathname: string; search: string } {
  const current = readDiscoveryContext(pathname, search)
  const selectingNeighborhood = typeof patch.neighborhood === 'string' && patch.neighborhood.length > 0
  const clearingNeighborhood = patch.neighborhood === null || patch.listNeighborhoods === true || typeof patch.zip === 'string'
  const neighborhood = selectingNeighborhood
    ? patch.neighborhood
    : clearingNeighborhood
      ? undefined
      : current.neighborhood
  const zip = patch.zip === null || selectingNeighborhood ? undefined : patch.zip ?? current.zip
  const city = patch.city === null || selectingNeighborhood || typeof patch.zip === 'string'
    ? undefined
    : patch.city ?? current.city
  const category = cleanCategory(patch.category === null ? '' : patch.category ?? current.category)
  const q = (patch.q === null ? '' : patch.q ?? current.q).trim()
  const view = patch.view === null ? 'feed' : patch.view ?? current.view

  let path = isDiscoveryPath(pathname) ? pathname : '/explore'
  if (patch.listNeighborhoods) path = '/neighborhoods'
  if (selectingNeighborhood && patch.neighborhood) path = `/neighborhoods/${patch.neighborhood}`
  if (!selectingNeighborhood && (patch.neighborhood === null || typeof patch.zip === 'string') && path.startsWith('/neighborhoods/')) {
    path = '/explore'
  }

  const params = new URLSearchParams(search)
  for (const key of ['zip', 'neighborhood', 'city', 'category', 'browse', 'group', 'q', 'view', 'from', 'item']) params.delete(key)
  if (selectingNeighborhood || typeof patch.zip === 'string' || typeof patch.city === 'string' || patch.listNeighborhoods) {
    for (const key of ['lat', 'lng', 'state', 'source']) params.delete(key)
  }
  if (zip && !neighborhood) params.set('zip', zip)
  if (neighborhood && path === '/explore') params.set('neighborhood', neighborhood)
  if (city && !neighborhood && !zip) params.set('city', city)
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  if (view === 'map') params.set('view', 'map')
  if (params.has('zip') && !params.has('radius')) params.set('radius', '25')
  return { pathname: path, search: params.toString() }
}
