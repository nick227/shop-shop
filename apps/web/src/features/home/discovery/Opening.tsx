import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { PlaceField } from '../neighborhood/PlaceField'
import { formatDistance } from '@shared/lib/utils/format'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'
import type { StoreTile, StoryTile } from './tiles'

export function LocationHero({
  mode,
  city,
  zip,
  shopCount,
  story,
  nearest,
  points,
  userLat,
  userLng,
  onSelectStore,
}: {
  readonly mode: 'home' | 'explore'
  readonly city?: string
  readonly zip?: string
  readonly shopCount: number
  readonly story?: StoryTile
  readonly nearest: readonly StoreTile[]
  readonly points: readonly MapPoint[]
  readonly userLat?: number
  readonly userLng?: number
  readonly onSelectStore: (id: string) => void
}) {
  const place = city ?? zip ?? 'Your neighborhood'
  const label = city && zip ? `${city}, ${zip}` : place
  const range = zip ? `${HOME_RADIUS_MILES} mi around ${label}` : 'Set a delivery ZIP'
  return (
    <section className="discover-hero" aria-label="Your neighborhood">
      <div className="hero-copy">
        <p className="tile-kicker">{mode === 'home' ? 'Your neighborhood' : 'Explore'} / {label}</p>
        <h1 className={mode === 'home' ? 'discover-display' : 'explore-title'}>{mode === 'home' ? place : 'Discover nearby.'}</h1>
        <p className="discover-lede">
          {shopCount > 0 ? `${shopCount} shops delivering around ${place}.` : 'Food, goods, and everyday essentials from the businesses around you.'}
        </p>
        {zip ? <p className="discover-where">{range}</p> : <div className="mt-4 max-w-sm"><PlaceField tone="hero" /></div>}
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
                <button type="button" onClick={() => onSelectStore(store.id)}>
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
