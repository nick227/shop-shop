import { Link, useSearchParams } from 'react-router-dom'
import { HOME_RADIUS_MILES, DEFAULT_STORE_IMAGE, rememberZip } from '../shell/placeMemory'
import { PlaceField } from '../neighborhood/PlaceField'
import { radiusLabel } from '../neighborhood/discoveryLocated'
import { homepageTitle, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { formatDistance } from '@shared/lib/utils/format'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'
import { PlaceCard, placeCardFromNeighborhood, type PlaceCardData } from '../neighborhood/PlaceCard'
import { PlaceGrid } from '../neighborhood/PlaceGrid'
import type { StoreTile, StoryTile } from './tiles'

const QUICK_AUSTIN_ZIPS = [
  { zip: '78704', label: 'South Austin · 78704' },
  { zip: '78701', label: 'Downtown · 78701' },
  { zip: '78702', label: 'East Austin · 78702' },
  { zip: '78705', label: 'Central · 78705' },
] as const

const PLATFORM_FEATURES: readonly PlaceCardData[] = [
  {
    id: 'feature-neighborhoods',
    href: '/neighborhoods',
    name: 'Around your neighborhood',
    category: 'ATTRACTION',
    categoryLabel: 'Neighborhoods',
    meta: 'Local guides · Openings · Events',
  },
  {
    id: 'feature-map',
    href: '/explore',
    name: 'Explore the map',
    category: 'RESTAURANT',
    categoryLabel: 'Directory',
    meta: 'Stores · Food · Essentials',
  },
  {
    id: 'feature-market',
    href: '/river?browse=grocery',
    name: 'Fresh nearby',
    category: 'GROCERY',
    categoryLabel: 'Local market',
    meta: 'Produce · Groceries · More',
  },
  {
    id: 'feature-vendors',
    href: '/river?browse=food',
    name: 'Order from local vendors',
    category: 'BAKERY',
    categoryLabel: 'Kitchens & shops',
    meta: 'Menus · Bundles · Pickup & delivery',
  },
]

export function PlatformFeatures() {
  return <PlaceGrid label="Discover local" places={PLATFORM_FEATURES} />
}

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
  const [params, setParams] = useSearchParams()
  const resolved = Boolean(city && state && zip && !error && !pending)

  const pickZip = (code: string) => {
    rememberZip(code)
    const next = new URLSearchParams(params)
    next.set('zip', code)
    next.set('radius', String(HOME_RADIUS_MILES))
    setParams(next, { replace: true })
  }

  return (
    <section className="discover-hero" aria-label="Shops near you">
      <div className="hero-copy">
        {resolved && city && state && zip ? (
          <>
            <h1 className="discover-display">{homepageTitle(city, state, neighborhoods)}</h1>
            <p className="discover-where">{radiusLabel(HOME_RADIUS_MILES, zip)}</p>
            {neighborhoods.length > 0 ? (
              <div className="place-row">
                {neighborhoods.map((area) => (
                  <PlaceCard key={area.id} place={placeCardFromNeighborhood(area)} />
                ))}
              </div>
            ) : null}
            <p className="discover-lede"><Link to={`/explore?zip=${zip}`}>Explore nearby</Link> · <Link to="/neighborhoods">Browse Austin neighborhoods</Link></p>
            {shopCount === 0 ? <p className="discover-lede">No shops in this radius yet.</p> : null}
          </>
        ) : (
          <>
            <p className="tile-kicker">Your neighborhood</p>
            <h1 className="discover-display">Find shops</h1>
            {error ? <p className="discover-lede" role="alert">{error}</p> : null}
            {pending ? <p className="discover-lede">Looking up {zip}…</p> : null}
            <p className="discover-lede">
              Food, goods, and everyday essentials from independent kitchens, markets, and shops around you.
            </p>
            <div className="mt-4 max-w-sm"><PlaceField tone="hero" /></div>
            <div className="explore-filters" role="group" aria-label="Popular Austin ZIP codes">
              {QUICK_AUSTIN_ZIPS.map((entry) => (
                <button key={entry.zip} type="button" onClick={() => pickZip(entry.zip)}>
                  {entry.label}
                </button>
              ))}
            </div>
            <p className="discover-lede">
              <Link to="/explore">Explore the map</Link> · <Link to="/neighborhoods">Browse Austin neighborhoods</Link>
            </p>
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
