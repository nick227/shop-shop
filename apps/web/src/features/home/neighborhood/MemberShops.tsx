import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { DirectoryListing } from './DirectoryList'
import { PlaceCard, placeCardFromListing, placeCardFromStore, type PlaceCardData } from './PlaceCard'

export function MemberShops({
  stores,
  curatedListings = [],
}: {
  readonly stores: readonly {
    readonly id: string
    readonly name: string
    readonly typeLabel?: string
    readonly image?: string
    readonly distance?: number
    readonly store?: { readonly description?: string | null }
  }[]
  readonly curatedListings?: readonly DirectoryListing[]
}) {
  const storeCards: (PlaceCardData & { readonly summary?: string | null })[] = stores.slice(0, 6).map((store) => {
    const base = placeCardFromStore(store)
    const desc = store.store?.description?.trim() || null
    const combinedMeta = [desc, base.meta].filter(Boolean).join(' · ') || 'Local storefront · Pickup & delivery'
    return {
      ...base,
      meta: combinedMeta,
      summary: desc,
    }
  })

  const storeNames = new Set(stores.map((store) => store.name.toLowerCase()))
  const curatedCards: (PlaceCardData & { readonly summary?: string | null })[] = curatedListings
    .filter((listing) => listing.featured && !storeNames.has(listing.name.toLowerCase()))
    .slice(0, Math.max(0, 4 - storeCards.length))
    .map((listing) => ({
      ...placeCardFromListing(listing),
      summary: listing.addressStreet ?? null,
    }))

  const places = [...storeCards, ...curatedCards].slice(0, 4)
  if (places.length === 0) return null

  const lead = places.find((place) => place.imageUrl) ?? places[0]!
  const leadImage = lead.imageUrl || undefined
  const supporting = places.filter((place) => place.id !== lead.id)

  return (
    <section className="surface-band featured-businesses-band" aria-label="Shops on Shop-Shop">
      <div className="surface-head">
        <div className="surface-head-titles">
          <p className="tile-kicker">Featured Local Businesses</p>
          <h2 className="surface-title">Shops on Shop-Shop</h2>
        </div>
        <Link to="/explore" className="browse-all-link">
          View directory
        </Link>
      </div>
      <div className={supporting.length > 0 ? 'featured-businesses-layout' : 'featured-businesses-single'}>
        <Link
          to={lead.href}
          className={`featured-lead-card${leadImage ? ' has-photo' : ' is-typographic'}`}
        >
          {leadImage ? (
            <div className="featured-lead-media">
              <img src={leadImage} alt="" />
            </div>
          ) : null}
          <div className="featured-lead-body">
            <div className="featured-lead-top">
              <span className="place-card-kicker">
                {[lead.categoryLabel, lead.summary ? null : lead.meta].filter(Boolean).join(' · ')}
              </span>
              <span className="featured-lead-tag">Featured</span>
            </div>
            <strong className="featured-lead-title">{lead.name}</strong>
            <p className="featured-lead-summary">
              {lead.summary || lead.meta || 'Order directly from this neighborhood storefront for pickup or local delivery.'}
            </p>
            <span className="featured-lead-cta">
              Visit storefront <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
        {supporting.length > 0 ? (
          <div className="featured-supporting-grid">
            {supporting.map((place) => (
              <PlaceCard key={place.id} place={place} variant="business" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
