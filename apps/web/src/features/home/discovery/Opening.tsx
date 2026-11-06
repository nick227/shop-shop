import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DiscoveryLink as Link } from '@features/discovery-navigation/DiscoveryLink'
import { ArrowUpRight, Bookmark, BookmarkCheck, Expand, MapPin, Minimize2, X } from 'lucide-react'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { PlaceField } from '../neighborhood/PlaceField'
import { neighborhoodPath, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { toggleSavedCollection, useSavedCollection } from '../neighborhood/savedCollection'
import { applyDiscoveryPatch, readDiscoveryContext } from './discoveryContext'
import type { PlaceKind } from './discoveryMode'
import { creditForUrl } from './editorialMedia'
import { isActiveTag, type HeroTag } from './heroTags'
import { realPhoto } from './photo'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'
import type { StoreTile, StoryTile } from './tiles'

type FeatureAction =
  | { readonly kind: 'link'; readonly label: string; readonly to: string | { pathname: string; search: string } }
  | { readonly kind: 'store'; readonly label: string; readonly store: StoreTile }

interface Feature {
  readonly image?: string
  /** What the photograph shows when it is not the place named in the headline. */
  readonly pictured?: string
  readonly action?: FeatureAction
}

function FeatureActions({ action, onSelectStore }: { readonly action: FeatureAction; readonly onSelectStore: (id: string) => void }) {
  return (
    <div className="hero-actions">
      {action.kind === 'link' ? (
        <Link to={action.to} className="hero-action">
          {action.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <>
          <button type="button" className="hero-action" onClick={() => onSelectStore(action.store.id)}>
            {action.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <SaveStore store={action.store} />
        </>
      )}
    </div>
  )
}

/**
 * The photograph and the one action that goes with it. A neighborhood only ever shows its own
 * cover; city and ZIP pages borrow a nearby neighborhood or storefront and say so.
 */
function chooseFeature(input: {
  readonly kind: PlaceKind
  readonly focus?: NeighborhoodCard
  readonly neighborhoods: readonly NeighborhoodCard[]
  readonly story?: StoryTile
  readonly nearest: readonly StoreTile[]
  readonly search: string
}): Feature {
  if (input.kind === 'neighborhood') {
    return { image: input.focus ? realPhoto(input.focus.coverUrl) : undefined }
  }
  const area = input.neighborhoods.find((entry) => realPhoto(entry.coverUrl))
  if (area) {
    return {
      image: realPhoto(area.coverUrl),
      pictured: area.name,
      action: { kind: 'link', label: `Explore ${area.name}`, to: neighborhoodPath(area.slug, input.search) },
    }
  }
  const storyStore = input.story?.storeId ? input.nearest.find((store) => store.id === input.story?.storeId) : undefined
  const storyImage = input.story ? realPhoto(input.story.image) : undefined
  if (storyStore && storyImage) {
    return { image: storyImage, pictured: storyStore.name, action: { kind: 'store', label: `Visit ${storyStore.name}`, store: storyStore } }
  }
  const store = input.nearest.find((entry) => entry.image)
  if (store?.image) {
    return { image: store.image, pictured: store.name, action: { kind: 'store', label: `Visit ${store.name}`, store } }
  }
  return {}
}

function HeroTags({ tags, pending }: { readonly tags: readonly HeroTag[]; readonly pending: boolean }) {
  const { pathname, search } = useLocation()
  const context = readDiscoveryContext(pathname, search)
  // Hold the row's height while counts load so the page below does not jump.
  if (pending) return <div className="hero-tags is-pending" aria-hidden="true" />
  if (tags.length === 0) return null
  return (
    <ul className="hero-tags" aria-label="Discover here">
      {tags.map((tag) => {
        if (!tag.filterable) {
          return (
            <li key={tag.key}>
              <span className="hero-tag is-editorial">{tag.label}</span>
            </li>
          )
        }
        const active = isActiveTag(tag, context.category, context.q)
        const to = applyDiscoveryPatch(pathname, search, active
          ? { category: null, q: null }
          : { category: tag.category || null, q: tag.q || null })
        const counted = tag.kind === 'DISCOVERY' && tag.count != undefined
        return (
          <li key={tag.key}>
            <Link
              to={to}
              className={`hero-tag${active ? ' is-active' : ''}`}
              aria-current={active ? 'true' : undefined}
              aria-label={`${tag.label}${counted ? `, ${tag.count} ${tag.count === 1 ? 'place' : 'places'}` : ''}${active ? ', clear filter' : ''}`}
            >
              {counted ? <span className="hero-tag-count">{tag.count}</span> : null}
              <span>{tag.label}</span>
              {active ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function SaveStore({ store }: { readonly store: StoreTile }) {
  const saved = useSavedCollection().some((entry) => entry.kind === 'store' && entry.id === store.id)
  return (
    <button
      type="button"
      className="hero-action is-quiet"
      aria-pressed={saved}
      onClick={() => {
        toggleSavedCollection({
          id: store.id,
          kind: 'store',
          title: store.name,
          subtitle: store.typeLabel,
          imageUrl: store.image,
          path: getStoreRoute({ id: store.id, name: store.name }),
        })
      }}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

export function LocationHero({
  zip,
  error,
  pending,
  story,
  nearest,
  points,
  center,
  radiusMiles,
  showYou,
  onSelectStore,
  neighborhoods,
  focus,
  mapView = false,
  kind,
  identity,
  showEditorial,
  tags = [],
  tagsPending = false,
}: {
  readonly zip?: string
  readonly neighborhoods: readonly NeighborhoodCard[]
  readonly error?: string
  readonly pending?: boolean
  readonly story?: StoryTile
  readonly nearest: readonly StoreTile[]
  readonly points: readonly MapPoint[]
  readonly center?: { readonly latitude?: number; readonly longitude?: number }
  readonly radiusMiles?: number
  readonly showYou?: boolean
  readonly onSelectStore: (id: string) => void
  readonly focus?: NeighborhoodCard
  readonly mapView?: boolean
  readonly kind: PlaceKind
  readonly identity: { readonly kicker: string; readonly title: string; readonly lede: string }
  readonly showEditorial: boolean
  readonly tags?: readonly HeroTag[]
  readonly tagsPending?: boolean
}) {
  const { pathname, search } = useLocation()
  const [editing, setEditing] = useState(false)
  // Same layout in every context; only the content changes. The photo stays put when filters change.
  const feature = chooseFeature({ kind, focus, neighborhoods, story, nearest, search })
  const image = feature.image
  const credit = image ? creditForUrl(image) : undefined
  const heroClass = [
    'discover-hero',
    mapView ? 'is-map' : '',
    showEditorial ? '' : 'is-results',
    kind === 'neighborhood' ? 'is-neighborhood' : '',
  ].filter(Boolean).join(' ')
  const mapToggle = applyDiscoveryPatch(pathname, search, { view: mapView ? null : 'map' })
  const changeLabel = kind === 'open' ? 'Set location' : 'Change location'

  return (
    <section className={heroClass} aria-label={kind === 'neighborhood' && focus ? focus.name : 'Shops near you'}>
      {mapView ? (
        <h1 className="sr-only">{identity.title}</h1>
      ) : (
        <div className={`hero-feature${image ? ' has-photo' : ' is-typographic'}`}>
          {image ? <img src={image} alt={feature.pictured ? `${feature.pictured}, ${identity.title}` : ''} className="hero-cover" /> : null}
          <div className="hero-feature-body">
            {image && (feature.pictured || credit) ? (
              <p className="hero-credit">
                {feature.pictured ? <span className="hero-pictured">Pictured: {feature.pictured}</span> : null}
                {credit ? <span>{credit}</span> : null}
              </p>
            ) : null}

            <div className="hero-feature-copy">
              <div className="hero-place-row">
                <p className="hero-location-kicker">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{identity.kicker}</span>
                </p>
                <button
                  type="button"
                  className={`hero-place-change${kind === 'open' ? ' is-primary' : ''}`}
                  aria-expanded={editing}
                  aria-controls="hero-place-field"
                  onClick={() => setEditing((open) => !open)}
                >
                  {editing ? 'Close' : changeLabel}
                </button>
                {editing ? (
                  <div className="hero-place-field" id="hero-place-field">
                    <PlaceField tone="hero" />
                  </div>
                ) : null}
              </div>
              <h1 className="discover-display">{identity.title}</h1>
              {error ? (
                <p className="discover-lede is-error" role="alert">{error}</p>
              ) : (
                <p className="discover-lede">{pending ? `Looking up ${zip ?? ''}…` : identity.lede}</p>
              )}
              <HeroTags tags={tags} pending={tagsPending} />
              {feature.action ? <FeatureActions action={feature.action} onSelectStore={onSelectStore} /> : null}
            </div>
          </div>
        </div>
      )}

      <div className="hero-map">
        <NeighborhoodMap points={points} center={center} radiusMiles={radiusMiles} showYou={showYou} onSelect={onSelectStore} />
        <Link to={mapToggle} className="hero-map-toggle">
          {mapView ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Expand className="h-4 w-4" aria-hidden="true" />}
          {mapView ? 'Back to feed' : 'View larger map'}
        </Link>
      </div>
    </section>
  )
}
