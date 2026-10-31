import { Link, useSearchParams } from 'react-router-dom'
import { PublicMaintenanceBanner } from '@features/home/components'
import { STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { HeroWindow } from './HeroWindow'
import { StoreMosaic, StoryStrip } from './MosaicAndStories'
import { PlaceField } from './PlaceField'
import { ProductShelf, StoreShelf } from './Shelves'
import { momentLine, selectHome } from './selectHome'
import { TypePlates } from './TypePlates'
import { hideVertical, useHomeTaste } from './taste'
import { useNeighborhoodData } from './useNeighborhoodData'

function placeTitle(city: string | undefined, zip: string | undefined): string {
  if (city) return city
  if (zip) return zip
  return 'Name your block.'
}

export function NeighborhoodHome() {
  const [params] = useSearchParams()
  const taste = useHomeTaste()
  const data = useNeighborhoodData()
  const hasPlace = Boolean(data.location)
  const selection = selectHome(data.stores, data.products, taste, hasPlace)
  const explore = new URLSearchParams(params)
  explore.delete('q')
  explore.delete('browse')

  const merchantCount = data.stores.length
  const title = placeTitle(data.location?.city, data.location?.zip)
  const personalSlug = selection.personalSlug
  const personalLabel = personalSlug
    ? STORE_TYPE_LABEL[personalSlug.toUpperCase()] ?? 'this'
    : ''

  return (
    <div className="home-stack">
      <PublicMaintenanceBanner />

      <div className="lead">
        <header className="opening">
          <p className="shop-mono text-xs" style={{ color: 'var(--quiet)' }}>
            {hasPlace
              ? `${data.location?.zip ?? 'Nearby'} · within ${Math.round(data.location?.radiusMiles ?? 5)} mi`
              : 'Delivery area'}
          </p>
          <h1 className="shop-display">{title}</h1>
          <p className="max-w-md text-base leading-snug">
            {hasPlace ? (
              <>
                {merchantCount > 0 ? <i className="live-dot" aria-hidden /> : null}
                {momentLine()}
              </>
            ) : (
              'Food, grocery, convenience, and the shop on the corner — once we know the ZIP.'
            )}
          </p>
          <p className="mt-3 max-w-md text-sm" style={{ color: 'var(--quiet)' }}>
            {hasPlace
              ? `${merchantCount} ${merchantCount === 1 ? 'merchant' : 'merchants'} in range. A store inside the radius can still be closed, or unable to deliver to your door.`
              : 'A ZIP is enough to look around. The street address comes when you check out.'}
          </p>
          <div className="mt-5">
            <PlaceField tone="hero" />
          </div>
          {hasPlace ? (
            <Link
              to={{ pathname: '/search', search: explore.toString() }}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold"
              style={{ color: 'var(--leaf)' }}
            >
              See everything in range
            </Link>
          ) : null}
        </header>
        <div className="lead-visual">
          {selection.hero && !data.storesLoading ? <HeroWindow store={selection.hero} /> : null}
        </div>
        <div className="lead-types">
          <TypePlates />
        </div>
      </div>

      {personalSlug ? (
        <StoreShelf
          title={`More ${personalLabel.toLowerCase()}`}
          caption="From the kinds of places you keep opening. A view counts less than an order."
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
        caption={
          selection.productsAreLocal
            ? 'Products from merchants inside your radius, with the store named on each one.'
            : hasPlace
              ? 'Nothing from this radius is in the latest menus yet. These are new elsewhere.'
              : 'Set a ZIP and this shelf tightens to merchants who can actually reach you.'
        }
        products={data.productsLoading ? [] : selection.products}
        stores={data.stores}
      />

      {!data.storesLoading && hasPlace && merchantCount === 0 ? (
        <p className="text-sm" style={{ color: 'var(--quiet)' }}>
          No merchants in this radius yet. Widen the distance, or try the next ZIP over.
        </p>
      ) : (
        <StoreMosaic
          stores={selection.mosaic}
          title={hasPlace ? 'On your streets' : 'Merchants to start with'}
          caption={
            hasPlace
              ? 'Merchants in range. Being nearby is not the same as being able to deliver to your door.'
              : 'Set a ZIP and this becomes the businesses around that delivery area.'
          }
        />
      )}

      <StoryStrip posts={data.stories} />

      <div className="sell-line">
        <p className="text-sm" style={{ color: 'var(--quiet)' }}>Have a storefront?</p>
        <Link to="/vendor/store/new" className="min-h-11 text-sm font-semibold">
          Sell on ShopShop
        </Link>
      </div>
    </div>
  )
}
