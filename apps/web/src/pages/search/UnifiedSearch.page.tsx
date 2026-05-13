/**
 * UnifiedSearchPage — search results with sort, load-more, map toggle, and discovery section.
 */
import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Search, MapPin, Star, X, LayoutList, Map as MapIcon,
  Truck, ShoppingBag, Clock, ArrowUpDown,
} from 'lucide-react'
import { useUnifiedSearchApi } from '@features/search/hooks/useUnifiedSearchApi'
import type { StoreSearchResult, ProductSearchResult } from '@features/search/hooks/useUnifiedSearchApi'
import { useTagGroups } from '@features/search/hooks/useTagGroups'
import { STORE_TYPE_CONFIG, SLUG_TO_STORE_TYPE, STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { SearchResultsMap } from '@features/search/components/SearchResultsMap'
import { PageShell } from '@shared/ui/layout/PageShell'
import { LocationUrlNotice, DiscoverySection } from '@features/home/components'
import { Badge } from '@shared/ui/primitives'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { formatDistance } from '@shared/lib/utils/format'
import { getStoreRoute, getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { getImageUrl } from '@shared/lib/utils/image'
import { cn } from '@shared/lib/cn'

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_STORE_LIMIT = 6
const INITIAL_PRODUCT_LIMIT = 8

// Tag categories shown as filter pills on the search page
const FILTER_TAG_CATEGORIES = ['CUISINE', 'DIETARY', 'FREE_FROM']

type SortOption = 'distance' | 'newest' | 'name'

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn('rounded animate-pulse bg-muted', className)} />
}

function StoreCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-2.5 p-3">
        {/* name + description */}
        <div className="space-y-1.5">
          <Bone className="w-3/4 h-4" />
          <Bone className="w-1/2 h-3" />
        </div>
        {/* location + rating row */}
        <div className="flex justify-between items-center">
          <Bone className="w-24 h-3" />
          <Bone className="w-16 h-3" />
        </div>
        {/* category + delivery row */}
        <div className="flex justify-between items-center">
          <Bone className="w-16 h-5 rounded-full" />
          <Bone className="w-20 h-3" />
        </div>
      </div>
    </div>
  )
}

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="animate-pulse aspect-square bg-muted" />
      <div className="space-y-1.5 p-3">
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-2/3" />
        <Bone className="w-1/3 h-4" />
        <Bone className="w-3/4 h-3" />
      </div>
    </div>
  )
}

// ─── Inline search refinement bar ────────────────────────────────────────────

function SearchRefinementBar({
  initialQuery,
  onSearch,
}: {
  initialQuery: string
  onSearch: (q: string) => void
}) {
  const [draft, setDraft] = useState(initialQuery)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch(draft.trim()) }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search kitchens, dishes…"
          className="pr-4 pl-10 w-full h-11 text-base rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center items-center px-5 h-11 text-sm font-semibold rounded-md transition-colors shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Search
      </button>
    </form>
  )
}

// ─── Store card ───────────────────────────────────────────────────────────────

function SearchStoreCard({
  store,
  onClick,
  index,
}: {
  store: StoreSearchResult
  onClick: () => void
  index: number
}) {
  const imageUrl = getStoreImageUrl(store, 'standard')
  const locationLabel = store.distance != undefined
    ? formatDistance(store.distance)
    : (store.address?.city
      ? `${store.address.city}${store.address.state ? `, ${store.address.state}` : ''}`
      : 'Near you')
  const categoryLabel = STORE_TYPE_LABEL[store.category] ?? store.category

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="overflow-hidden rounded-xl border transition-all cursor-pointer border-border bg-card tap-scale hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img src={imageUrl} alt={store.name} className="object-cover w-full h-full" loading="lazy" />
        {store.isOpen === false && (
          <div className="flex absolute inset-0 justify-center items-center bg-background/60">
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Closed
            </span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div>
          <h3 className="text-base font-semibold leading-tight line-clamp-1">{store.name}</h3>
          {store.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{store.description}</p>
          )}
          {store.address && (
            <>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{store.address.street}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{store.address.city}, {store.address.state}</p>
            </>
          )}
        </div>

        <div className="flex gap-2 justify-between items-center text-xs text-muted-foreground">
          <span className="flex gap-1 items-center truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {locationLabel}
          </span>
          <div className="flex gap-2 items-center shrink-0">
            {store.rating != undefined && (
              <span className="flex items-center gap-0.5 font-semibold text-foreground">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {store.rating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 shrink-0" />
              ~{store.prepTimeMin} min
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Badge variant="secondary" className="text-xs font-normal">{categoryLabel}</Badge>
          <div className="flex gap-2 items-center text-xs">
            {store.deliveryEnabled && (
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <Truck className="w-3 h-3 text-primary" />
                Delivery
              </span>
            )}
            {store.pickupEnabled && (
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <ShoppingBag className="w-3 h-3 text-primary" />
                Pickup
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Product card ─────────────────────────────────────────────────────────────

function SearchProductCard({
  product,
  onClick,
  index,
}: {
  product: ProductSearchResult
  onClick: () => void
  index: number
}) {
  const isSoldOut = product.isSoldOut || !product.available
  const imageUrl = getImageUrl(product.imageUrl, product.id, 'product')
  const storeHref = getStoreRoute({ id: product.storeId, name: product.storeName })

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex overflow-hidden flex-col rounded-xl border transition-colors cursor-pointer border-border bg-card hover:border-primary/40 hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
    >
      <div className="overflow-hidden relative aspect-square bg-muted">
        <img
          src={imageUrl}
          alt={product.title}
          className="object-cover w-full h-full"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {isSoldOut && (
          <div className="flex absolute inset-0 justify-center items-center bg-background/60">
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-destructive">
              Sold out
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">{product.title}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">${product.price.toFixed(2)}</p>
        <Link
          to={storeHref}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 line-clamp-1 text-xs text-primary hover:underline"
        >
          {product.storeName}
        </Link>
      </div>
    </div>
  )
}

// ─── Re-fetch progress bar ────────────────────────────────────────────────────

function RefetchBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        'h-0.5 w-full overflow-hidden rounded-full bg-muted transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
      aria-hidden
    >
      <div className="w-1/3 h-full rounded-full animate-shimmer bg-primary/50" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UnifiedSearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const q = searchParams.get('q') || undefined
  const activeBrowse = searchParams.get('browse') ?? ''
  const { location, urlLocationNotice, setUrlLocationNotice, clearLocation } = useUrlLocation()

  const [sort, setSort] = useState<SortOption>(location?.latitude ? 'distance' : 'newest')
  const [storeLimit, setStoreLimit] = useState(INITIAL_STORE_LIMIT)
  const [productLimit, setProductLimit] = useState(INITIAL_PRODUCT_LIMIT)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const { data: tagGroupsData } = useTagGroups({
    target: 'STORE',
    categories: FILTER_TAG_CATEGORIES,
  })
  const filterTagGroups = tagGroupsData?.groups ?? []

  const searchRequest = {
    q,
    city: location?.city,
    state: location?.state,
    zip: location?.zip,
    latitude: location?.latitude,
    longitude: location?.longitude,
    radiusMiles: location?.radiusMiles,
    storeType: SLUG_TO_STORE_TYPE[activeBrowse],
    tags: activeTags.length > 0 ? activeTags : undefined,
  }

  const { data: searchResults, isLoading, isFetching, error } = useUnifiedSearchApi(searchRequest)

  // True only on first load with no cached data — show skeletons
  const isFirstLoad = isLoading
  // Re-fetching with stale data present — keep results visible but dim them
  const isRefetching = isFetching && !isLoading

  const allStoreResults = searchResults?.sections.stores.results ?? []
  const allProductResults = searchResults?.sections.products.results ?? []

  const sortedStores = useMemo(() => {
    const stores = [...allStoreResults]
    if (sort === 'distance') return stores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    if (sort === 'newest') return stores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return stores.sort((a, b) => a.name.localeCompare(b.name))
  }, [allStoreResults, sort])

  const storesWithCoords = useMemo(
    () => sortedStores.filter((s) => s.latitude != undefined && s.longitude != undefined),
    [sortedStores],
  )

  const visibleStores = sortedStores.slice(0, storeLimit)
  const visibleProducts = allProductResults.slice(0, productLimit)
  const storeTotal = allStoreResults.length
  const productTotal = allProductResults.length
  const hasResults = storeTotal > 0 || productTotal > 0

  // Key that changes when query/filter/sort/tags changes — re-triggers card entrance animations
  const storeGridKey = `stores-${q ?? ''}-${activeBrowse}-${sort}-${activeTags.join(',')}`
  const productGridKey = `products-${q ?? ''}-${activeBrowse}-${activeTags.join(',')}`

  const resetLimits = () => {
    setStoreLimit(INITIAL_STORE_LIMIT)
    setProductLimit(INITIAL_PRODUCT_LIMIT)
  }

  const handleSearch = (newQ: string) => {
    const next = new URLSearchParams(searchParams)
    if (newQ) next.set('q', newQ); else next.delete('q')
    resetLimits()
    setActiveTags([])
    navigate({ pathname: '/search', search: next.toString() })
  }

  const handleStoreClick = (store: StoreSearchResult) =>
    navigate(getStoreRoute({ id: store.id, name: store.name }))

  const handleProductClick = (product: ProductSearchResult) =>
    navigate(getItemRouteSimple({ id: product.id, title: product.title }))

  const handleCategoryClick = (slug: string) => {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set('browse', slug); else next.delete('browse')
    resetLimits()
    setActiveTags([])
    navigate({ pathname: '/search', search: next.toString() })
  }

  const handleTagToggle = (slug: string) => {
    setActiveTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
    resetLimits()
  }

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-5xl"
      contentClassName="space-y-6 py-6 md:space-y-8"
    >
      <LocationUrlNotice
        notice={urlLocationNotice}
        onDismiss={() => setUrlLocationNotice(undefined)}
      />

      {/* Search bar — key remounts draft when URL query changes */}
      <SearchRefinementBar key={q ?? ''} initialQuery={q ?? ''} onSearch={handleSearch} />

      {/* Context header */}
      {q ? (
        searchResults && !isFirstLoad && hasResults && (
          <p className="text-sm animate-fade-in text-muted-foreground">
            {storeTotal > 0 && `${storeTotal} ${storeTotal === 1 ? 'kitchen' : 'kitchens'}`}
            {storeTotal > 0 && productTotal > 0 && ' · '}
            {productTotal > 0 && `${productTotal} menu ${productTotal === 1 ? 'item' : 'items'}`}
          </p>
        )
      ) : (
        <header className="space-y-0.5">
          <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            {location?.city ? 'Browsing near you' : 'Discover'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {location?.city
              ? `Kitchens in ${location.city}${location.state ? `, ${location.state}` : ''}`
              : 'All kitchens'}
          </h1>
        </header>
      )}

      {/* Active location chip */}
      {location && (
        <div className="flex gap-2 items-center animate-fade-in">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium">
              {location.displayName ?? (location.city
                ? `${location.city}${location.state ? `, ${location.state}` : ''}`
                : location.zip ?? 'Near you')}
            </span>
            {location.radiusMiles && (
              <span className="text-muted-foreground">· {location.radiusMiles} mi</span>
            )}
            <button
              type="button"
              onClick={clearLocation}
              aria-label="Clear location filter"
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Store-type filter pills */}
      <div
        role="group"
        aria-label="Filter by category"
        className="flex overflow-x-auto gap-2 px-4 pb-1 -mx-4 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {STORE_TYPE_CONFIG.map(({ slug, label, Icon }) => {
          const isActive = activeBrowse === slug
          return (
            <button
              key={slug || 'all'}
              type="button"
              onClick={() => handleCategoryClick(slug)}
              className={cn(
                'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Live tag filter pills — grouped by category from /api/tags */}
      {filterTagGroups.length > 0 && (
        <div className="space-y-2">
          {filterTagGroups.map((group) => (
            <div
              key={group.category}
              role="group"
              aria-label={`Filter by ${group.label}`}
              className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              {group.tags.map((tag) => {
                const isActive = activeTags.includes(tag.slug)
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => handleTagToggle(tag.slug)}
                    className={cn(
                      'inline-flex flex-none items-center px-3 py-1 text-xs font-medium whitespace-nowrap rounded-full border transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    )}
                  >
                    {tag.label}
                  </button>
                )
              })}
              {activeTags.some((s) => group.tags.some((t) => t.slug === s)) && (
                <button
                  type="button"
                  onClick={() => setActiveTags((prev) => prev.filter((s) => !group.tags.some((t) => t.slug === s)))}
                  className="inline-flex flex-none gap-1 items-center px-3 py-1 text-xs whitespace-nowrap rounded-full border border-dashed transition-colors border-muted-foreground/40 text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                  Clear {group.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── First-load skeletons ── */}
      {isFirstLoad && (
        <div className="space-y-8">
          {/* Store skeletons */}
          <div>
            <Bone className="mb-4 w-28 h-6" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <StoreCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
          {/* Product skeletons */}
          <div>
            <Bone className="mb-4 w-24 h-6" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !isFetching && (
        <div className="p-6 text-center rounded-2xl border animate-fade-in border-destructive/25 bg-destructive/5">
          <p className="text-sm text-destructive">Search failed — {error.message}</p>
        </div>
      )}

      {/* ── Results (also rendered during re-fetch to avoid layout pop) ── */}
      {searchResults && !isFirstLoad && !error && (
        <div
          className={cn(
            'space-y-8 transition-opacity duration-200 ease-in-out',
            isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100',
          )}
        >
          {/* Re-fetch progress indicator */}
          <RefetchBar visible={isRefetching} />

          {/* ── Kitchens ── */}
          {storeTotal > 0 && (
            <section>
              <div className="flex flex-wrap gap-y-2 gap-x-3 items-center mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Kitchens</h2>
                <span className="text-sm text-muted-foreground">{storeTotal}</span>

                <div className="ml-auto flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {(['distance', 'newest', 'name'] as SortOption[]).map((opt) => {
                    const disabled = opt === 'distance' && !location?.latitude
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSort(opt)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                          sort === opt
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground',
                          disabled && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        {opt === 'distance' ? 'Nearest' : (opt === 'newest' ? 'Newest' : 'A–Z')}
                      </button>
                    )
                  })}

                  {storesWithCoords.length > 0 && (
                    <div className="flex overflow-hidden ml-1 rounded-full border border-border bg-card">
                      <button
                        type="button"
                        onClick={() => setView('list')}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 text-xs transition-colors',
                          view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <LayoutList className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('map')}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 text-xs transition-colors',
                          view === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <MapIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Map</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {view === 'map' ? (
                <div className="animate-fade-in">
                  <SearchResultsMap
                    stores={storesWithCoords}
                    userLat={location?.latitude}
                    userLng={location?.longitude}
                    onStoreClick={handleStoreClick}
                    height="420px"
                  />
                </div>
              ) : (
                <>
                  {/* key re-mounts grid → re-triggers animate-fade-up on each card */}
                  <div key={storeGridKey} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleStores.map((store, i) => (
                      <SearchStoreCard
                        key={store.id}
                        store={store}
                        onClick={() => handleStoreClick(store)}
                        index={i}
                      />
                    ))}
                  </div>
                  {storeLimit < storeTotal && (
                    <button
                      type="button"
                      onClick={() => setStoreLimit((l) => l + INITIAL_STORE_LIMIT)}
                      className="py-3 mt-4 w-full text-sm font-medium rounded-xl border transition-colors border-border bg-card text-muted-foreground hover:bg-muted/40"
                    >
                      Show more kitchens · {storeTotal - storeLimit} remaining
                    </button>
                  )}
                </>
              )}
            </section>
          )}

          {/* ── Menu items ── */}
          {productTotal > 0 && (
            <section>
              <div className="flex gap-4 justify-between items-baseline mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Menu items</h2>
                <span className="text-sm shrink-0 text-muted-foreground">{productTotal}</span>
              </div>
              <div key={productGridKey} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {visibleProducts.map((product, i) => (
                  <SearchProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                    index={i}
                  />
                ))}
              </div>
              {productLimit < productTotal && (
                <button
                  type="button"
                  onClick={() => setProductLimit((l) => l + INITIAL_PRODUCT_LIMIT)}
                  className="py-3 mt-4 w-full text-sm font-medium rounded-xl border transition-colors border-border bg-card text-muted-foreground hover:bg-muted/40"
                >
                  Show more items · {productTotal - productLimit} remaining
                </button>
              )}
            </section>
          )}

          {/* ── No results ── */}
          {!hasResults && q && (
            <div className="p-8 text-center rounded-2xl border animate-fade-in border-border bg-card">
              <p className="text-base font-medium text-foreground">No results for &ldquo;{q}&rdquo;</p>
              <p className="mt-1 text-sm text-muted-foreground">Try different words, or browse kitchens below.</p>
              <Link
                to="/search"
                className="inline-flex justify-center items-center px-4 mt-4 h-9 text-sm font-medium rounded-md border transition-colors border-border hover:bg-muted"
              >
                Clear search
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Discovery section */}
      {!isFetching && (
        <>
          {hasResults && <div className="border-t border-border" />}
          <DiscoverySection />
        </>
      )}
    </PageShell>
  )
}
