import { placeCardFromListing } from './PlaceCard'
import { PlaceGrid, PlaceSkeleton } from './PlaceGrid'

export type DirectoryListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly category?: string
  readonly merchant?: boolean
  readonly featured?: boolean
  readonly addressStreet: string | null
  readonly distance: number
  readonly website: string | null
  readonly phone?: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly attribution: string | null
  readonly coverUrl?: string | null
}

export function DirectoryList({ listings, loading = false }: { readonly listings: readonly DirectoryListing[]; readonly loading?: boolean }) {
  if (loading) return <PlaceSkeleton />
  if (listings.length === 0) return null
  const credit = listings.find((listing) => listing.attribution)?.attribution
  return (
    <>
      <PlaceGrid places={listings.map(placeCardFromListing)} label="Directory" featureFirst />
      {credit ? <p className="discover-lede">{credit}</p> : null}
    </>
  )
}
