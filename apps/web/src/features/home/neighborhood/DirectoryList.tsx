export type DirectoryListing = {
  readonly id: string
  readonly name: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly distance: number
  readonly website: string | null
  readonly orderable: boolean
  readonly attribution: string | null
}

export function DirectoryList({ listings }: { readonly listings: readonly DirectoryListing[] }) {
  if (listings.length === 0) return null
  const credit = listings.find((listing) => listing.attribution)?.attribution
  return (
    <section className="discover-hero" aria-label="Directory">
      <div className="hero-copy">
        <p className="tile-kicker">Directory</p>
        <ul className="hero-areas">
          {listings.slice(0, 12).map((listing) => (
            <li key={listing.id}>
              <span>
                <strong>{listing.name}</strong>
                {' · '}{listing.categoryLabel}
                {listing.addressStreet ? ` · ${listing.addressStreet}` : ''}
                {` · ${listing.distance.toFixed(1)} mi`}
              </span>
              <span>Not accepting orders</span>
            </li>
          ))}
        </ul>
        {credit ? <p className="discover-lede">{credit}</p> : null}
      </div>
    </section>
  )
}
