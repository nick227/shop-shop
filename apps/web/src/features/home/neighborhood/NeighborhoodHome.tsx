import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PublicMaintenanceBanner } from '@features/home/components'
import { STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { HeroWindow } from './HeroWindow'
import { SiteBranding } from './SiteBranding'
import { StoreMosaic, StoryStrip } from './MosaicAndStories'
import { PlaceField } from './PlaceField'
import { RecentShelf } from './RecentShelf'
import { SignedInShelves } from './SignedInShelves'
import { ProductShelf, StoreShelf } from './Shelves'
import { formatDistance } from '@shared/lib/utils/format'
import { HOME_RADIUS_MILES, placeZip, rememberedPlace } from '../shell/placeMemory'
import { selectHome } from './selectHome'
import { defaultAddressZip } from './signedInSelect'
import { TypePlates } from './TypePlates'
import { ProductRange } from './ProductRange'
import { hideVertical, useHomeTaste } from './taste'
import { useNeighborhoodData } from './useNeighborhoodData'
import { useSignedInHome } from './useSignedInHome'

function placeTitle(city: string | undefined, zip: string | undefined): string {
  if (city) return city
  if (zip) return zip
  return 'Location'
}

export function NeighborhoodHome() {
  const [params, setParams] = useSearchParams()
  const taste = useHomeTaste()
  const data = useNeighborhoodData()
  const account = useSignedInHome()
  const accountZip = defaultAddressZip(account.addresses)
  const shownZip = data.location?.zip || placeZip(params.toString()) || accountZip || ''

  useEffect(() => {
    const zip = params.get('zip') ?? new URLSearchParams(rememberedPlace()).get('zip') ?? accountZip
    if (!zip) return
    if (params.get('zip') === zip && params.get('radius') === String(HOME_RADIUS_MILES)) return
    const next = new URLSearchParams(params)
    next.set('zip', zip)
    next.set('radius', String(HOME_RADIUS_MILES))
    setParams(next, { replace: true })
  }, [accountZip, params, setParams])

  const hasPlace = Boolean(data.location)
  const selection = selectHome(data.stores, data.products, taste, hasPlace)
  const explore = new URLSearchParams(params)
  explore.delete('q')
  explore.delete('browse')

  const merchantCount = data.stores.length
  const title = placeTitle(data.location?.city, shownZip)
  const placeName = data.location?.city ?? data.location?.zip
  const closest = data.stores
    .filter((store) => typeof store.distance === 'number' && store.id !== selection.hero?.id)
    .slice(0, 6)
  const personalSlug = selection.personalSlug
  const personalLabel = personalSlug
    ? STORE_TYPE_LABEL[personalSlug.toUpperCase()] ?? 'this'
    : ''

  return (
    <div className="home-stack">
      <PublicMaintenanceBanner />

      <div className="lead">
        <header className="opening flex flex-col justify-start h-full">
          <SiteBranding />
          <div>  
            <p className="shop-mono text-xs" style={{ color: 'var(--quiet)' }}>
              {shownZip
                ? `${shownZip} · ${HOME_RADIUS_MILES} mi`
                : 'Delivery area'}
            </p>
            <h1>{title}</h1>
            <div className="mt-4">
              <PlaceField tone="hero" />
            </div>
            {hasPlace ? (
              <Link
                to={{ pathname: '/search', search: explore.toString() }}
                className="mt-3 inline-flex min-h-11 items-center text-sm"
                style={{ color: 'var(--quiet)' }}
              >
                See everything in range
              </Link>
            ) : null}
          </div>
        </header>
        <div className="lead-visual">
          {selection.hero && !data.storesLoading ? <HeroWindow store={selection.hero} /> : null}
        </div>
        <div className="lead-types">
          <TypePlates stores={data.stores} />
        </div>
      </div>

      <ProductRange products={data.products} stores={data.stores} />

      <SignedInShelves
        account={account}
        stores={data.stores}
        products={data.products}
        hasPlace={hasPlace}
      />

      {hasPlace && closest.length > 0 ? (
        <StoreShelf
          title={placeName ? `Closest in ${placeName}` : 'Closest to you'}
          caption=""
          stores={closest}
          detail={(store) => formatDistance(store.distance ?? 0)}
        />
      ) : null}

      <RecentShelf />

      {personalSlug ? (
        <StoreShelf
          title={`More ${personalLabel.toLowerCase()}`}
          caption=""
          stores={selection.personal}
          action={
            <button
              type="button"
              className="min-h-11 shrink-0 text-sm"
              style={{ color: 'var(--quiet)' }}
              onClick={() => hideVertical(personalSlug)}
            >
              Show less like this
            </button>
          }
        />
      ) : null}

      <ProductShelf
        title={selection.productsAreLocal ? 'From stores in range' : 'New on ShopShop'}
        caption=""
        products={data.productsLoading ? [] : selection.products}
        stores={data.stores}
      />

      {!data.storesLoading && hasPlace && merchantCount === 0 ? (
        <p className="text-sm" style={{ color: 'var(--quiet)' }}>
          No merchants in this area yet. Try the next ZIP over.
        </p>
      ) : (
        <StoreMosaic
          stores={selection.mosaic}
          title={hasPlace ? 'On your streets' : 'Merchants to start with'}
          caption=""
        />
      )}

      <StoryStrip posts={data.stories} />

    </div>
  )
}
