import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PublicMaintenanceBanner } from '@features/home/components'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { useNeighborhoodData } from '../neighborhood/useNeighborhoodData'
import { recordRecent } from '../neighborhood/recentViews'
import { useSignedInHome } from '../neighborhood/useSignedInHome'
import { defaultAddressZip } from '../neighborhood/signedInSelect'
import { HOME_RADIUS_MILES, placeZip, rememberedPlace, rememberZip } from '../shell/placeMemory'
import { CategorySection } from './CategoryCircles'
import { DetailPanel } from './DetailPanel'
import { MarketFeed } from './MarketFeed'
import { LocationHero, PlatformFeatures } from './Opening'
import { RecentFeed } from './RecentFeed'
import { DirectoryList } from '../neighborhood/DirectoryList'
import { DirectorySections } from '../neighborhood/DirectorySections'
import { MemberShops } from '../neighborhood/MemberShops'
import { placeCardFromNeighborhood } from '../neighborhood/PlaceCard'
import { PlaceGrid } from '../neighborhood/PlaceGrid'
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
    browse,
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
    recordRecent({
      id: tile.id,
      kind: 'store',
      title: tile.name,
      imageUrl: tile.image,
      subtitle: tile.typeLabel,
      path: getStoreRoute({ id: tile.id, name: tile.name }),
    })
  }, [selected])

  const marketTiles = composed.stories[0]
    ? composed.tiles.filter((tile) => tile.id !== composed.stories[0]?.id)
    : composed.tiles
  const hasLocation = Boolean(data.location)

  return (
    <div className="discover">
      <PublicMaintenanceBanner />
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
      {!hasLocation ? (
        <>
          <PlatformFeatures />
          <CategorySection />
          {data.neighborhoods.length > 0 ? (
            <PlaceGrid
              label="Austin neighborhoods"
              featureFirst
              places={data.neighborhoods.slice(0, 8).map(placeCardFromNeighborhood)}
              footer={<p className="discover-lede"><Link to="/neighborhoods">Browse all Austin neighborhoods</Link></p>}
            />
          ) : null}
        </>
      ) : null}
      <MemberShops stores={composed.storeTiles} />
      {hasLocation || marketTiles.length > 0 ? (
        <MarketFeed
          tiles={marketTiles}
          nearest={composed.nearest}
          showCategories={hasLocation}
          onOpen={(tile, anchor) => setSelected({ tile, anchor })}
        />
      ) : null}
      <DirectoryList listings={(directory.data ?? []).slice(0, 8)} loading={directory.isLoading} />
      <DirectorySections listings={(directory.data ?? []).slice(8)} />
      <RecentFeed
        orders={account.orders}
        savedItems={account.favorites.items}
        savedStores={account.favorites.stores}
        stores={data.stores}
        products={data.products}
        tiles={composed.tiles}
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
