import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PublicMaintenanceBanner } from '@features/home/components'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { useNeighborhoodData } from '../neighborhood/useNeighborhoodData'
import { recordRecent, useRecentViews } from '../neighborhood/recentViews'
import { useSignedInHome } from '../neighborhood/useSignedInHome'
import { defaultAddressZip } from '../neighborhood/signedInSelect'
import { verticalSlugForStore } from '../neighborhood/selectHome'
import { recordVertical } from '../neighborhood/taste'
import { HOME_RADIUS_MILES, placeZip, rememberedPlace, rememberZip } from '../shell/placeMemory'
import { applyDiscoveryPatch, canonicalDiscoverySearch, directoryGroup, readDiscoveryContext } from './discoveryContext'
import { discoveryBands, discoveryEmphasis, heroIdentity, neighborhoodBandCopy, placeKind, provisionalPlaceName, type DiscoveryBand } from './discoveryMode'
import { matchesDirectoryBrowse } from './infiniteFeed'
import { discoveryMapPoints } from './mapResults'
import { DiscoveryToolbar } from './DiscoveryToolbar'
import { useDiscoveryScroll } from './useDiscoveryScroll'
import { CategorySection } from './CategoryCircles'
import { DetailPanel } from './DetailPanel'
import { ForYouSurface } from './ForYouSurface'
import { MarketFeed } from './MarketFeed'
import { LocationHero } from './Opening'
import { MemberShops } from '../neighborhood/MemberShops'
import { PlaceCard, placeCardFromNeighborhood } from '../neighborhood/PlaceCard'
import type { NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { useDirectory } from '../neighborhood/useDirectory'
import { mergeCurated, useNeighborhoodGuide } from '../neighborhood/useNeighborhoodGuide'
import { composeDiscovery, type DiscoveryItem, type DiscoveryTile } from './tiles'
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
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const context = readDiscoveryContext(pathname, params.toString())
  const data = useNeighborhoodData()
  const kind = placeKind(context, pathname)
  const emphasis = discoveryEmphasis(context, kind)
  useDiscoveryScroll(`${context.neighborhood ?? ''}|${context.zip ?? ''}|${context.city ?? ''}|${pathname === '/neighborhoods'}`)
  const held = useRef<{ lat?: number; lng?: number }>({})
  if (data.location?.latitude != null && data.location.longitude != null) {
    held.current = { lat: data.location.latitude, lng: data.location.longitude }
  }
  const directoryLat = data.location?.latitude ?? (data.placePending ? held.current.lat : undefined)
  const directoryLng = data.location?.longitude ?? (data.placePending ? held.current.lng : undefined)
  const directory = useDirectory(directoryLat, directoryLng, {
    q: context.q,
    group: directoryGroup(context.category),
  })
  const guide = useNeighborhoodGuide(context.neighborhood)
  const account = useSignedInHome()
  const accountZip = defaultAddressZip(account.addresses, account.orders)
  const [selected, setSelected] = useState<{ tile: DiscoveryTile; anchor?: DOMRect } | undefined>()

  useEffect(() => {
    const canonical = canonicalDiscoverySearch(params.toString())
    if (canonical !== params.toString()) {
      setParams(new URLSearchParams(canonical), { replace: true })
      return
    }
    if (context.hasExplicitPlace) {
      if (context.zip) rememberZip(context.zip)
      return
    }
    const zip = new URLSearchParams(rememberedPlace()).get('zip') ?? accountZip
    if (!zip) return
    rememberZip(zip)
    if (params.get('zip') === zip && params.get('radius') === String(HOME_RADIUS_MILES)) return
    const next = new URLSearchParams(params)
    next.set('zip', zip)
    next.set('radius', String(HOME_RADIUS_MILES))
    setParams(next, { replace: true })
  }, [accountZip, context.hasExplicitPlace, context.zip, params, setParams])

  const browse = context.category
  const query = context.q
  const shownZip = data.location?.zip || placeZip(params.toString()) || accountZip || ''
  const composed = useMemo(() => composeDiscovery({
    stores: data.stores,
    products: data.products as DiscoveryItem[],
    stories: data.stories,
    browse,
    query,
  }), [browse, data.products, data.stores, data.stories, query])
  const listings = useMemo(
    () => mergeCurated(directory.data ?? [], context.neighborhood ? guide.data ?? [] : []),
    [context.neighborhood, directory.data, guide.data],
  )
  const visibleListings = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return listings.filter((listing) => {
      if (!matchesDirectoryBrowse(listing, browse)) return false
      if (!needle) return true
      return `${listing.name} ${listing.categoryLabel} ${listing.addressStreet ?? ''}`.toLowerCase().includes(needle)
    })
  }, [browse, listings, query])
  const points = useMemo(
    () => discoveryMapPoints(composed.places, visibleListings, browse, query),
    [browse, composed.places, query, visibleListings],
  )

  const openStore = (id: string) => {
    if (id.startsWith('directory:')) {
      navigate(`/directory/${id.slice('directory:'.length)}`)
      return
    }
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

  const marketTiles = emphasis === 'search'
    ? composed.tiles
    : composed.stories[0]
      ? composed.tiles.filter((tile) => tile.id !== composed.stories[0]?.id)
      : composed.tiles
  const hasLocation = Boolean(data.location)
  const visibleNeighborhoods = data.neighborhoods.length > 0 ? data.neighborhoods : FALLBACK_AUSTIN_NEIGHBORHOODS
  const nearbyCards = (data.nearby ?? []).map((area) => ({ ...area, about: null }))
  const neighborhoodPool = kind === 'neighborhood' && nearbyCards.length > 0
    ? nearbyCards.filter((area) => area.slug !== context.neighborhood)
    : visibleNeighborhoods.filter((area) => area.slug !== context.neighborhood)
  const listedNeighborhoods = pathname === '/neighborhoods' ? visibleNeighborhoods : neighborhoodPool.slice(0, 4)
  const focus = data.activePlace
    ? { ...data.activePlace, coverUrl: data.activePlace.images[0] ?? null }
    : context.neighborhood
      ? {
          id: context.neighborhood,
          name: provisionalPlaceName(context.neighborhood, true),
          slug: context.neighborhood,
          headline: null,
          about: null,
          coverUrl: null,
        }
      : undefined
  const cityName = data.activePlace?.city?.name ?? data.cityPlace?.name ?? data.location?.city ?? 'Austin'
  const citySlug = data.activePlace?.city?.slug ?? data.cityPlace?.slug ?? context.city
  const placeLabel = kind === 'neighborhood'
    ? focus?.name ?? 'Neighborhood'
    : kind === 'zip'
      ? `${cityName} ${shownZip}`
      : cityName
  const areaNames = listedNeighborhoods.slice(0, 3).map((area) => area.name).join(', ')
  const identity = heroIdentity({
    kind,
    emphasis,
    city: cityName,
    state: data.activePlace?.city?.state ?? data.cityPlace?.state ?? data.location?.state,
    zip: shownZip,
    focus,
    shopCount: points.length,
    areaNames,
    category: context.category,
    query,
  })
  const neighborhoodCopy = neighborhoodBandCopy(kind, shownZip, cityName)

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
  for (const listing of visibleListings.filter((item) => item.featured).slice(0, Math.max(0, 4 - memberStores.length))) {
    featuredStoreIds.add(`directory:${listing.id}`)
  }
  const feedStories = composed.stories.slice(1).filter((story) => !heroStoreId || story.storeId !== heroStoreId)

  const sections: Record<DiscoveryBand, ReactNode> = {
    hero: (
      <LocationHero
        zip={kind === 'neighborhood' ? undefined : shownZip}
        focus={focus}
        mapView={context.view === 'map'}
        kind={kind}
        identity={identity}
        showEditorial={emphasis !== 'search'}
        error={data.location ? undefined : data.notice?.message}
        pending={data.waitingForZip}
        story={composed.stories[0]}
        nearest={composed.nearest}
        points={points}
        userLat={data.location?.latitude}
        userLng={data.location?.longitude}
        onSelectStore={openStore}
        neighborhoods={listedNeighborhoods}
      />
    ),
    neighborhoods: (
      <section className="surface-band neighborhoods-anchor" aria-label={neighborhoodCopy.label}>
        <div className="surface-head">
          <div className="surface-head-titles">
            <p className="tile-kicker">{neighborhoodCopy.kicker}</p>
            <h2 className="surface-title">{neighborhoodCopy.title}</h2>
          </div>
          {pathname === '/neighborhoods' ? null : (
            <Link
              to={applyDiscoveryPatch(pathname, params.toString(), { listNeighborhoods: true, zip: null, city: null })}
              className="browse-all-link"
            >
              Browse all neighborhoods
            </Link>
          )}
        </div>
        <div className="neighborhood-showcase-row">
          {listedNeighborhoods.map((area) => (
            <PlaceCard
              key={area.id}
              place={placeCardFromNeighborhood(area, params.toString())}
              variant="neighborhood"
            />
          ))}
        </div>
      </section>
    ),
    personal: (
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
    ),
    shops: <MemberShops stores={memberStores} curatedListings={visibleListings} />,
    categories: <CategorySection />,
    feed: (
      <MarketFeed
        tiles={marketTiles}
        nearest={composed.nearest}
        storeTiles={composed.storeTiles}
        stories={feedStories}
        listings={visibleListings}
        browse={browse}
        query={query}
        excludeIds={emphasis === 'search' ? new Set<string>() : featuredStoreIds}
        showCategories={false}
        onOpen={(tile, anchor) => setSelected({ tile, anchor })}
      />
    ),
  }

  return (
    <div className="discover" aria-busy={data.placePending || undefined}>
      <PublicMaintenanceBanner />
      <DiscoveryToolbar placeLabel={placeLabel} citySlug={citySlug} cityName={cityName} />
      {discoveryBands(emphasis).map((band) => <Fragment key={band}>{sections[band]}</Fragment>)}

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
