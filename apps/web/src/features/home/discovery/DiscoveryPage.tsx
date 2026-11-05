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
import { useDirectory } from '../neighborhood/useDirectory'
import { composeDiscovery, mapPoints, type DiscoveryItem, type DiscoveryTile } from './tiles'
import './discovery.css'

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
  const views = useRecentViews()
  const personalStoreIds = new Set([
    ...account.orders.map((order) => order.storeId),
    ...account.favorites.stores.map((store) => store.id),
    ...views.filter((view) => view.kind === 'store').map((view) => view.id),
  ])
  const heroStoreId = composed.nearest.find((store) => store.image)?.id
  const memberStores = composed.storeTiles.filter((store) => store.id !== heroStoreId && !personalStoreIds.has(store.id))
  const featuredStoreIds = new Set(memberStores.slice(0, 4).map((store) => `store:${store.id}`))
  for (const id of personalStoreIds) featuredStoreIds.add(`store:${id}`)
  if (heroStoreId) featuredStoreIds.add(`store:${heroStoreId}`)

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
        neighborhoods={data.neighborhoods}
      />

      {data.neighborhoods.length > 0 ? (
        <section
          className="surface-band neighborhoods-anchor"
          aria-label={hasLocation ? 'Nearby Neighborhoods' : 'Austin neighborhoods'}
        >
          <div className="surface-head">
            <h2 className="surface-title">
              {hasLocation ? 'Neighborhoods around this area' : 'Austin neighborhoods'}
            </h2>
            <Link to="/neighborhoods" className="browse-all-link">
              Browse all neighborhoods
            </Link>
          </div>
          <div className="neighborhood-showcase-row">
            {data.neighborhoods.slice(0, 4).map((area) => (
              <PlaceCard
                key={area.id}
                place={placeCardFromNeighborhood(area)}
                variant="neighborhood"
              />
            ))}
          </div>
        </section>
      ) : null}

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

      <MemberShops stores={memberStores} curatedListings={listings} />

      {/* Surface 6: Browse by Category */}
      <CategorySection />

      {/* Surface 7: Infinite Discovery Feed */}
      <MarketFeed
        tiles={marketTiles}
        nearest={composed.nearest}
        storeTiles={composed.storeTiles}
        stories={composed.stories}
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
