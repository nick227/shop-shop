import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { PlaceField } from '../neighborhood/PlaceField'
import type { StoreTile, StoryTile } from './tiles'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'

function Frame({ image, label }: { readonly image?: string; readonly label: string }) {
  if (image) return <img src={image} alt="" />
  return <div className="brand-fall"><span>{label}</span></div>
}

export function Opening({
  city,
  zip,
  hero,
}: {
  readonly city?: string
  readonly zip?: string
  readonly hero?: StoreTile
}) {
  const place = city ?? zip ?? 'Your neighborhood'
  return (
    <section className="discover-hero">
      <div>
        <p className="tile-kicker">Your neighborhood</p>
        <h1 className="discover-display">{place}</h1>
        <p className="discover-lede">Food, goods, and everyday essentials from the businesses around you.</p>
        {zip ? (
          <p className="discover-where">Delivering across {zip} · {HOME_RADIUS_MILES} mi</p>
        ) : (
          <div className="mt-4 max-w-sm"><PlaceField tone="hero" /></div>
        )}
        <a href="#market" className="detail-buy discover-jump">Explore nearby</a>
      </div>
      <Frame image={hero?.image} label={hero?.name ?? place} />
    </section>
  )
}

export function ExploreHead({ city, zip }: { readonly city?: string; readonly zip?: string }) {
  const place = [city, zip].filter(Boolean).join(', ') || 'your area'
  return (
    <header className="explore-head">
      <p className="tile-kicker">Explore / {place}</p>
      <h1>Discover nearby.</h1>
      <p>Local stores, food, and everyday essentials.</p>
    </header>
  )
}

export function Bento({
  story,
  hero,
  points,
  userLat,
  userLng,
  onSelectStore,
}: {
  readonly story?: StoryTile
  readonly hero?: StoreTile
  readonly points: readonly MapPoint[]
  readonly userLat?: number
  readonly userLng?: number
  readonly onSelectStore: (id: string) => void
}) {
  return (
    <section className="discover-bento" aria-label="Around your neighborhood">
      <button type="button" className="bento-story" onClick={() => story?.storeId && onSelectStore(story.storeId)}>
        <p className="tile-kicker">{story?.kicker ?? 'Around the block'}</p>
        <strong>{story?.title ?? 'Your neighborhood, in a few notes'}</strong>
        <p>{story?.body ?? 'Openings and notes from shops that deliver here.'}</p>
      </button>
      <div className="bento-map">
        <p className="tile-kicker">The neighborhood</p>
        <NeighborhoodMap points={points} userLat={userLat} userLng={userLng} onSelect={onSelectStore} />
      </div>
      <div className="bento-fresh">
        {hero?.image ? <img src={hero.image} alt="" /> : <div className="brand-fall"><span>{hero?.name ?? 'Nearby'}</span></div>}
        <div>
          <p className="tile-kicker">Fresh nearby</p>
          <strong>{hero?.name ?? 'Local shops'}</strong>
        </div>
      </div>
    </section>
  )
}
