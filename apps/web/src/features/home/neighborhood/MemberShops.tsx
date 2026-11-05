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
  const storeCards: (PlaceCardData & { readonly summary?: string | null })[] = stores.slice(0, 6).map((store) => ({
    ...placeCardFromStore(store),
    summary: store.store?.description ?? null,
  }))

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

  const lead = places.find((place) => place.imageUrl)
  const leadImage = lead?.imageUrl || undefined
  const supporting = lead ? places.filter((place) => place.id !== lead.id) : places

  return (
    <section className="surface-band featured-businesses-band" aria-label="Shops on Shop-Shop">
      <div className="surface-head">
        <h2 className="surface-title">Shops on Shop-Shop</h2>
        <Link to="/explore">View directory</Link>
      </div>
      <div className={lead && leadImage ? 'featured-businesses-layout' : 'featured-supporting-grid'}>
        {lead && leadImage ? (
          <Link to={lead.href} className="featured-lead-card has-photo">
            <div className="featured-lead-media">
              <img src={leadImage} alt="" />
            </div>
            <div className="featured-lead-body">
              <span className="place-card-kicker">{[lead.categoryLabel, lead.meta].filter(Boolean).join(' · ')}</span>
              <strong className="featured-lead-title">{lead.name}</strong>
              {lead.summary ? <p className="featured-lead-summary">{lead.summary}</p> : null}
              <span className="featured-lead-cta">
                Visit storefront <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ) : null}
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
