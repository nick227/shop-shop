import { useLocation, useNavigate } from 'react-router-dom'
import { Map, Rows3 } from 'lucide-react'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { applyDiscoveryPatch, readDiscoveryContext } from './discoveryContext'

const CATEGORIES = [
  ...STORE_TYPE_CONFIG.filter((entry) => entry.slug),
  { slug: 'arts', label: 'Arts' },
  { slug: 'outdoors', label: 'Outdoors' },
] as const

export function DiscoveryToolbar({ placeLabel }: { readonly placeLabel: string }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const context = readDiscoveryContext(pathname, search)

  const go = (patch: Parameters<typeof applyDiscoveryPatch>[2]) => {
    navigate(applyDiscoveryPatch(pathname, search, patch))
  }

  return (
    <div className="discovery-toolbar" role="search">
      <div className="discovery-toolbar-place">
        <span className="tile-kicker">{context.neighborhood ? 'Neighborhood' : 'Location'}</span>
        <strong>{placeLabel}</strong>
        {context.neighborhood ? (
          <button type="button" onClick={() => go({ neighborhood: null })}>All of Austin</button>
        ) : (
          <button type="button" onClick={() => go({ listNeighborhoods: true, zip: null })}>Neighborhoods</button>
        )}
      </div>
      {context.q ? (
        <button type="button" className="discovery-toolbar-query" onClick={() => go({ q: null })}>
          “{context.q}”
        </button>
      ) : null}
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
