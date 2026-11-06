import { useLocation, useNavigate } from 'react-router-dom'
import { Map, Rows3, X } from 'lucide-react'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { DiscoveryLink as Link } from '@features/discovery-navigation/DiscoveryLink'
import { Breadcrumbs, type Crumb } from '@features/discovery-navigation/Breadcrumbs'
import { applyDiscoveryPatch, readDiscoveryContext } from './discoveryContext'
import { CATEGORY_LABEL, placeKind } from './discoveryMode'

const CATEGORIES = [
  ...STORE_TYPE_CONFIG.filter((entry) => entry.slug),
  { slug: 'arts', label: 'Arts' },
  { slug: 'outdoors', label: 'Outdoors' },
] as const

/**
 * Place › category › search, as a trail. Every level is a link back up, and the
 * search term sits in the trail instead of on its own row, so filtering never
 * changes the toolbar's height.
 */
function discoveryCrumbs(input: {
  readonly pathname: string
  readonly search: string
  readonly cityName: string
  readonly citySlug?: string
  readonly zip?: string
  readonly zipUnresolved?: boolean
  readonly neighborhoodName?: string
}): Crumb[] {
  const { pathname, search } = input
  const context = readDiscoveryContext(pathname, search)
  const kind = placeKind(context, pathname)
  const crumbs: Crumb[] = []
  const city = applyDiscoveryPatch(pathname, search, { neighborhood: null, zip: null, city: input.citySlug || 'austin-tx', category: null, q: null })
  if (kind === 'open' || (kind === 'zip' && input.zipUnresolved)) crumbs.push({ key: 'place', label: 'Explore', to: applyDiscoveryPatch(pathname, search, { zip: null, category: null, q: null }) })
  else crumbs.push({ key: 'city', label: input.cityName, to: city })
  if (kind === 'zip' && input.zip) crumbs.push({ key: 'zip', label: input.zip, to: applyDiscoveryPatch(pathname, search, { category: null, q: null }) })
  if (kind === 'neighborhood') crumbs.push({ key: 'neighborhood', label: input.neighborhoodName ?? 'Neighborhood', to: applyDiscoveryPatch(pathname, search, { category: null, q: null }) })
  if (context.category) crumbs.push({ key: 'category', label: CATEGORY_LABEL[context.category] ?? context.category, to: applyDiscoveryPatch(pathname, search, { q: null }) })
  if (context.q.trim()) {
    crumbs.push({
      key: 'q',
      label: `“${context.q.trim()}”`,
      after: (
        <Link to={applyDiscoveryPatch(pathname, search, { q: null })} className="crumb-clear" aria-label={`Clear search “${context.q.trim()}”`}>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ),
    })
  }
  return crumbs
}

export function DiscoveryToolbar({
  citySlug,
  cityName,
  zip,
  zipUnresolved,
  neighborhoodName,
}: {
  readonly citySlug?: string
  readonly cityName?: string
  readonly zip?: string
  readonly zipUnresolved?: boolean
  readonly neighborhoodName?: string
}) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const context = readDiscoveryContext(pathname, search)

  const go = (patch: Parameters<typeof applyDiscoveryPatch>[2]) => {
    navigate(applyDiscoveryPatch(pathname, search, patch))
  }

  return (
    <div className="discovery-toolbar" role="search">
      <div className="discovery-toolbar-place">
        <Breadcrumbs
          label="Discovery breadcrumb"
          className="discovery-crumbs"
          crumbs={discoveryCrumbs({ pathname, search, cityName: cityName || 'Austin', citySlug, zip, zipUnresolved, neighborhoodName })}
        />
        {pathname === '/neighborhoods' ? null : (
          <button type="button" onClick={() => go({ listNeighborhoods: true, zip: null })}>Neighborhoods</button>
        )}
      </div>
      <div className="discovery-toolbar-categories" role="toolbar" aria-label="Category">
        <button type="button" aria-pressed={context.category === ''} onClick={() => go({ category: null })}>All</button>
        {CATEGORIES.map((entry) => (
          <button
            key={entry.slug}
            type="button"
            aria-pressed={context.category === entry.slug}
            onClick={() => go({ category: context.category === entry.slug ? null : entry.slug })}
          >
            {entry.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={context.view === 'map'}
          onClick={() => go({ view: context.view === 'map' ? null : 'map' })}
        >
          {context.view === 'map' ? <Rows3 className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          {context.view === 'map' ? 'Feed' : 'Map'}
        </button>
      </div>
    </div>
  )
}
