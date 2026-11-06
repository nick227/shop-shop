import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, MapPin, Sparkles } from 'lucide-react'
import { PlaceField } from '../neighborhood/PlaceField'
import { homepageTitle, neighborhoodPath, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { formatDistance } from '@shared/lib/utils/format'
import { realPhoto } from './photo'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'
import type { StoreTile, StoryTile } from './tiles'

export function LocationHero({
  city,
  state,
  zip,
  error,
  pending,
  shopCount,
  story,
  nearest,
  points,
  userLat,
  userLng,
  onSelectStore,
  neighborhoods,
  focus,
  mapView = false,
}: {
  readonly city?: string
  readonly state?: string
  readonly zip?: string
  readonly neighborhoods: readonly NeighborhoodCard[]
  readonly shopCount: number
  readonly error?: string
  readonly pending?: boolean
  readonly story?: StoryTile
  readonly nearest: readonly StoreTile[]
  readonly points: readonly MapPoint[]
  readonly userLat?: number
  readonly userLng?: number
  readonly onSelectStore: (id: string) => void
  readonly focus?: NeighborhoodCard
  readonly mapView?: boolean
}) {
  const { search } = useLocation()
  const [editing, setEditing] = useState(false)
  const resolved = Boolean(city && state && zip && !error && !pending)
  const featureStore = nearest.find((store) => store.image) ?? nearest[0]
  const featureArea = neighborhoods.find((area) => realPhoto(area.coverUrl))
  const featureCover = featureArea ? realPhoto(featureArea.coverUrl) : undefined
  const focusCover = focus ? realPhoto(focus.coverUrl) : undefined
  const storyImage = focusCover ?? (story ? realPhoto(story.image) : undefined) ?? featureStore?.image ?? featureCover
  const featureImage = featureStore?.image ?? featureCover

  const kicker = focus
    ? [city, state].filter(Boolean).join(', ') || 'Neighborhood'
    : resolved && zip ? `${city ?? 'Austin'}, ${state ?? 'TX'} · ${zip}` : 'Austin Local Guide'
  const areaNames = neighborhoods.slice(0, 3).map((n) => n.name).join(', ')
  const lede = resolved
    ? `${shopCount > 0 ? `${shopCount} local storefronts` : 'Neighborhood kitchens & markets'} around ${areaNames || city}.`
    : 'Enter a ZIP code for neighborhood delivery, or explore Austin’s neighborhoods below.'

  return (
    <section className={mapView ? 'discover-hero is-map' : 'discover-hero'} aria-label={focus ? focus.name : 'Shops near you'}>
      <div className="hero-editorial-panel">
        {focus && focusCover ? (
          <div className="hero-story has-photo">
            <img src={focusCover} alt="" className="hero-cover" />
            <div className="hero-story-copy">
              <span className="hero-highlight-kicker">Neighborhood</span>
              <div className="hero-story-main">
                <strong>{focus.name}</strong>
                {focus.headline ? <span>{focus.headline}</span> : null}
              </div>
            </div>
          </div>
        ) : story ? (
          <button
            type="button"
            className={`hero-story${storyImage ? ' has-photo' : ' is-typographic'}`}
            onClick={() => story.storeId && onSelectStore(story.storeId)}
          >
            {storyImage ? <img src={storyImage} alt="" className="hero-cover" /> : null}
            <div className="hero-story-copy">
              <span className="hero-highlight-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Neighborhood Highlight
              </span>
              <div className="hero-story-main">
                <strong>{story.title}</strong>
                <span>{story.body}</span>
                <span className="hero-story-cta">
                  View kitchen &amp; menu <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </button>
        ) : featureStore ? (
          <button
            type="button"
            className={`hero-story${featureImage ? ' has-photo' : ' is-typographic'}`}
            onClick={() => onSelectStore(featureStore.id)}
          >
            {featureImage ? <img src={featureImage} alt="" className="hero-cover" /> : null}
            <div className="hero-story-copy">
              <span className="hero-highlight-kicker">Featured Storefront</span>
              <div className="hero-story-main">
                <strong>{featureStore.name}</strong>
                <span>
                  {featureStore.typeLabel}
                  {featureStore.distance != undefined ? ` · ${formatDistance(featureStore.distance)}` : ''}
                </span>
                <span className="hero-story-cta">
                  Explore storefront <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </button>
        ) : featureArea && featureCover ? (
          <Link to={neighborhoodPath(featureArea.slug, search)} className="hero-story has-photo">
            <img src={featureCover} alt="" className="hero-cover" />
            <div className="hero-story-copy">
              <span className="hero-highlight-kicker">Neighborhood Spotlight</span>
              <div className="hero-story-main">
                <strong>{featureArea.name}</strong>
                {featureArea.headline ? <span>{featureArea.headline}</span> : null}
                <span className="hero-story-cta">
                  Explore {featureArea.name} <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="hero-story is-typographic">
            <div className="hero-story-copy">
              <span className="hero-highlight-kicker">Austin Field Guide</span>
              <div className="hero-story-main">
                <strong>Neighborhood kitchens, markets &amp; daily goods</strong>
                <span>Browse independent storefronts and local places across South Congress, Zilker, and East Austin.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hero-side-column">
        <div className="hero-copy hero-identity-panel">
          <div className="hero-identity-top">
            <div className="hero-kicker-row">
              <p className="tile-kicker hero-location-kicker">
                <MapPin className="h-3.5 w-3.5" />
                <span>{kicker}</span>
              </p>
              {resolved || focus ? (
                <button
                  type="button"
                  className="location-change-btn"
                  aria-expanded={editing}
                  onClick={() => setEditing((open) => !open)}
                >
                  {editing ? 'Close' : 'Change ZIP'}
                </button>
              ) : null}
            </div>
            <h1 className="discover-display">
              {focus ? focus.name : resolved && city && state ? homepageTitle(city, state, neighborhoods) : 'Find shops'}
            </h1>
            {error ? (
              <p className="discover-lede is-error" role="alert">
                {error}
              </p>
            ) : pending ? (
              <p className="discover-lede">Looking up {zip}…</p>
            ) : (
              <p className="discover-lede">{focus?.headline || focus?.about || lede}</p>
            )}
          </div>

          {(!resolved && !focus) || editing ? (
            <div className="hero-location-controls">
              <div className="hero-zip-field">
                <PlaceField tone="hero" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="hero-map">
          <NeighborhoodMap points={points} userLat={userLat} userLng={userLng} onSelect={onSelectStore} />
        </div>
      </div>
    </section>
  )
}
