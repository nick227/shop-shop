import { Link } from 'react-router-dom'
import { HOME_RADIUS_MILES, DEFAULT_STORE_IMAGE } from '../shell/placeMemory'
import { PlaceField } from '../neighborhood/PlaceField'
import { radiusLabel } from '../neighborhood/discoveryLocated'
import { homepageTitle, neighborhoodPath, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { formatDistance } from '@shared/lib/utils/format'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'
import type { StoreTile, StoryTile } from './tiles'

export function LocationHero({
  city,
  state,
  zip,
  shopCount,
  error,
  pending,
  story,
  nearest,
  points,
  userLat,
  userLng,
  onSelectStore,
  neighborhoods,
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
}) {
  const resolved = Boolean(city && state && zip && !error && !pending)
  return (
    <section className="discover-hero" aria-label="Shops near you">
      <div className="hero-copy">
        {resolved && city && state && zip ? (
          <>
            <h1 className="discover-display">{homepageTitle(city, state, neighborhoods)}</h1>
            <p className="discover-where">{radiusLabel(HOME_RADIUS_MILES, zip)}</p>
            {neighborhoods.length > 0 ? (
              <>
                <p className="tile-kicker">Neighborhoods in this area</p>
                <ul className="hero-areas">
                  {neighborhoods.map((area) => (
                    <li key={area.id}>
                      <Link to={neighborhoodPath(area.slug)}>
                        <strong>{area.name}</strong>
                        {area.headline ? <span>{area.headline}</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {shopCount === 0 ? <p className="discover-lede">No shops in this radius yet.</p> : null}
          </>
        ) : (
          <>
            <h1 className="discover-display">Find shops</h1>
            {error ? <p className="discover-lede" role="alert">{error}</p> : null}
            {pending ? <p className="discover-lede">Looking up {zip}…</p> : null}
            <div className="mt-4 max-w-sm"><PlaceField tone="hero" /></div>
          </>
        )}
        {story ? (
          <button type="button" className="hero-story" onClick={() => story.storeId && onSelectStore(story.storeId)}>
            <span className="tile-kicker">{story.kicker}</span>
            <strong>{story.title}</strong>
            <span>{story.body}</span>
          </button>
        ) : null}
        {nearest.length > 0 ? (
          <ul className="hero-near">
            {nearest.map((store) => (
              <li key={store.id}>
                {store.image ? <img src={store.image} alt="" className="w-6 h-6 rounded-full object-cover" /> : <img src={DEFAULT_STORE_IMAGE} alt="" className="w-6 h-6 rounded-full object-cover" />}
                <button type="button" className="flex items-center gap-2" onClick={() => onSelectStore(store.id)}>
                  <strong>{store.name}</strong>
                  <span>{store.typeLabel}{store.distance != undefined ? ` · ${formatDistance(store.distance)}` : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="hero-map">
        <NeighborhoodMap points={points} userLat={userLat} userLng={userLng} onSelect={onSelectStore} />
      </div>
    </section>
  )
}
