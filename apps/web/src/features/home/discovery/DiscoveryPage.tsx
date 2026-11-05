import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PublicMaintenanceBanner } from '@features/home/components'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { useNeighborhoodData } from '../neighborhood/useNeighborhoodData'
import { recordRecent, useRecentViews } from '../neighborhood/recentViews'
import { useSignedInHome } from '../neighborhood/useSignedInHome'
import { defaultAddressZip } from '../neighborhood/signedInSelect'
import { verticalSlugForStore } from '../neighborhood/selectHome'
import { recordVertical } from '../neighborhood/taste'
import { HOME_RADIUS_MILES, placeZip, rememberedPlace, rememberZip } from '../shell/placeMemory'
import { CategorySection } from './CategoryCircles'
import { DetailPanel } from './DetailPanel'
import { ForYouSurface } from './ForYouSurface'
import { MarketFeed } from './MarketFeed'
import { LocationHero } from './Opening'
import { MemberShops } from '../neighborhood/MemberShops'
import { PlaceCard, placeCardFromNeighborhood } from '../neighborhood/PlaceCard'
import type { NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { useDirectory } from '../neighborhood/useDirectory'
import { composeDiscovery, mapPoints, type DiscoveryItem, type DiscoveryTile } from './tiles'
import './discovery.css'

const FALLBACK_AUSTIN_NEIGHBORHOODS: readonly (NeighborhoodCard & { readonly postalCodes: readonly string[] })[] = [
  {
    id: 'fallback-zilker',
    name: 'Zilker',
    slug: 'austin-tx-zilker',
    headline: 'Barton Springs, parkland trails, and neighborhood food trailers',
    about: null,
    coverUrl: null,
    postalCodes: ['78704'],
  },
  {
    id: 'fallback-south-congress',
    name: 'South Congress',
    slug: 'austin-tx-south-congress',
    headline: 'Independent boutiques, live music rooms, and sidewalk cafes',
    about: null,
    coverUrl: null,
    postalCodes: ['78704'],
  },
  {
    id: 'fallback-south-lamar',
    name: 'South Lamar',
    slug: 'austin-tx-south-lamar',
    headline: 'Neighborhood taquerias, record shops, and indie cinema',
    about: null,
    coverUrl: null,
    postalCodes: ['78704'],
  },
  {
    id: 'fallback-east-austin',
    name: 'East Austin',
    slug: 'austin-tx-east-austin',
    headline: 'Craft roasters, smokehouses, and creative studios',
    about: null,
    coverUrl: null,
    postalCodes: ['78702'],
  },
]

export function DiscoveryPage() {
  const [params, setParams] = useSearchParams()
  const data = useNeighborhoodData()
  const directory = useDirectory(data.location?.latitude, data.location?.longitude)
  const account = useSignedInHome()
  const accountZip = defaultAddressZip(account.addresses, account.orders)
  const [selected, setSelected] = useState<{ tile: DiscoveryTile; anchor?: DOMRect } | undefined>()

  useEffect(() => {
    const zip = params.get('zip') ?? new URLSearchParams(rememberedPlace()).get('zip') ?? accountZip
    if (!zip) return
    rememberZip(zip)
    if (params.get('zip') === zip && params.get('radius') === String(HOME_RADIUS_MILES)) return
    const next = new URLSearchParams(params)
    next.set('zip', zip)
    next.set('radius', String(HOME_RADIUS_MILES))
    setParams(next, { replace: true })
  }, [accountZip, params, setParams])

  const browse = params.get('browse') ?? ''
  const query = params.get('q') ?? ''
  const shownZip = data.location?.zip || placeZip(params.toString()) || accountZip || ''
  const composed = useMemo(() => composeDiscovery({
    stores: data.stores,
    products: data.products as DiscoveryItem[],
    stories: data.stories,
    browse: browse === 'arts' || browse === 'outdoors' ? '' : browse,
    query,
  }), [browse, data.products, data.stores, data.stories, query])
  const points = useMemo(() => mapPoints(composed.places), [composed.places])

  const openStore = (id: string) => {
    const tile = composed.tiles.find((entry) => entry.kind === 'store' && entry.id === id)
      ?? (composed.hero?.id === id ? composed.hero : undefined)
    if (tile) setSelected({ tile })
  }

  const related = selected?.tile.kind === 'store'
    ? composed.tiles.filter((entry): entry is DiscoveryTile & { kind: 'product' } => entry.kind === 'product' && entry.storeId === selected.tile.id)
    : []

  useEffect(() => {
    const tile = selected?.tile
    if (!tile || tile.kind === 'story') return
    if (tile.kind === 'product') {
      const store = data.stores.find((entry) => entry.id === tile.storeId)
      const slug = store ? verticalSlugForStore(store) : undefined
      if (slug) recordVertical(slug)
      recordRecent({
        id: tile.id,
        kind: 'item',
        title: tile.title,
        imageUrl: tile.image,
        subtitle: `${tile.price} · ${tile.storeName}`,
        path: getItemRouteSimple({ id: tile.id, title: tile.title }),
      })
      return
    }
    const slug = verticalSlugForStore(tile.store as never)
    if (slug) recordVertical(slug)
    recordRecent({
      id: tile.id,
      kind: 'store',
      title: tile.name,
      imageUrl: tile.image,
      subtitle: tile.typeLabel,
      path: getStoreRoute({ id: tile.id, name: tile.name }),
    })
  }, [data.stores, selected])

  const marketTiles = composed.stories[0]
    ? composed.tiles.filter((tile) => tile.id !== composed.stories[0]?.id)
    : composed.tiles
  const listings = directory.data ?? []
  const hasLocation = Boolean(data.location)
  const visibleNeighborhoods = data.neighborhoods.length > 0 ? data.neighborhoods : FALLBACK_AUSTIN_NEIGHBORHOODS

  const views = useRecentViews()
  const personalStoreIds = new Set([
    ...account.orders.map((order) => order.storeId),
    ...account.favorites.stores.map((store) => store.id),
    ...views.filter((view) => view.kind === 'store').map((view) => view.id),
  ])
  const heroStoreId = composed.stories[0]?.storeId ?? (composed.nearest.find((store) => store.image) ?? composed.nearest[0])?.id
  const nonPersonalStores = composed.storeTiles.filter((store) => !personalStoreIds.has(store.id))
  const memberStores = nonPersonalStores.length > 2
    ? nonPersonalStores.filter((store) => store.id !== heroStoreId)
    : nonPersonalStores
  const featuredStoreIds = new Set(memberStores.slice(0, 4).map((store) => `store:${store.id}`))
  for (const id of personalStoreIds) featuredStoreIds.add(`store:${id}`)
  if (heroStoreId) featuredStoreIds.add(`store:${heroStoreId}`)
  for (const listing of listings.filter((item) => item.featured).slice(0, Math.max(0, 4 - memberStores.length))) {
    featuredStoreIds.add(`directory:${listing.id}`)
  }
  const feedStories = composed.stories.slice(1).filter((story) => !heroStoreId || story.storeId !== heroStoreId)

  return (
    <div className="discover">
      <PublicMaintenanceBanner />

      {/* Surface 1: A Living Location Header */}
      <LocationHero
        city={data.location?.city}
        state={data.location?.state}
        zip={data.location?.zip || shownZip}
        error={data.location ? undefined : data.notice?.message}
        pending={data.waitingForZip}
        shopCount={composed.places.length}
        story={composed.stories[0]}
        nearest={composed.nearest}
        points={points}
        userLat={data.location?.latitude}
        userLng={data.location?.longitude}
        onSelectStore={openStore}
        neighborhoods={visibleNeighborhoods}
      />

      {/* Surface 2 (Visual Anchor): Explore Neighborhoods */}
      <section
        className="surface-band neighborhoods-anchor"
        aria-label={hasLocation ? 'Nearby Neighborhoods' : 'Austin neighborhoods'}
      >
        <div className="surface-head">
          <div className="surface-head-titles">
            <p className="tile-kicker">Explore Austin</p>
            <h2 className="surface-title">
              {hasLocation ? 'Neighborhoods around this area' : 'Austin neighborhoods'}
            </h2>
          </div>
          <Link to="/neighborhoods" className="browse-all-link">
            Browse all neighborhoods
          </Link>
        </div>
        <div className="neighborhood-showcase-row">
          {visibleNeighborhoods.slice(0, 4).map((area) => (
            <PlaceCard
              key={area.id}
              place={placeCardFromNeighborhood(area)}
              variant="neighborhood"
            />
          ))}
        </div>
      </section>

      {/* Surfaces 3 & 4 Combined: Personal Area (For You + Your Collection) */}
      <ForYouSurface
        tiles={composed.tiles}
        storeTiles={composed.storeTiles}
        stores={data.stores}
        products={data.products}
        orders={account.orders}
        addresses={account.addresses}
        savedItems={account.favorites.items}
        savedStores={account.favorites.stores}
        usual={account.usual}
        hasLocation={hasLocation}
        onOpen={(tile, anchor) => setSelected({ tile, anchor })}
      />

      {/* Surface 5: Featured Local Businesses */}
      <MemberShops stores={memberStores} curatedListings={listings} />

      {/* Surface 6: Browse by Category */}
      <CategorySection />

      {/* Surface 7: Infinite Discovery Feed */}
      <MarketFeed
        tiles={marketTiles}
        nearest={composed.nearest}
        storeTiles={composed.storeTiles}
        stories={feedStories}
        listings={listings}
        browse={browse}
        query={query}
        excludeIds={featuredStoreIds}
        showCategories={false}
        onOpen={(tile, anchor) => setSelected({ tile, anchor })}
      />

      {selected ? (
        <DetailPanel
          tile={selected.tile}
          anchor={selected.anchor}
          related={related}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </div>
  )
}
