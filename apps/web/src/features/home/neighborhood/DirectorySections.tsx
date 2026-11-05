import type { DirectoryListing } from './DirectoryList'
import { placeCardFromListing } from './PlaceCard'
import { PlaceGrid } from './PlaceGrid'

type Group = 'food' | 'shopping' | 'arts' | 'parks'

function groupOf(listing: DirectoryListing): Group | null {
  const label = listing.categoryLabel
  if (label === 'Park' || label === 'Library') return 'parks'
  if (listing.category === 'RESTAURANT' || listing.category === 'COFFEE' || listing.category === 'BAKERY' || label === 'Bar' || label === 'Pub' || label === 'Ice cream') return 'food'
  if (listing.category === 'RETAIL' || listing.category === 'GROCERY' || listing.category === 'CONVENIENCE') return 'shopping'
  if (listing.category === 'ENTERTAINMENT' || listing.category === 'ATTRACTION') return 'arts'
  return null
}

const TITLES: Record<Group, string> = {
  food: 'Food & Drink',
  shopping: 'Shopping',
  arts: 'Arts & Entertainment',
  parks: 'Parks & Outdoors',
}

export function DirectorySections({ listings }: { readonly listings: readonly DirectoryListing[] }) {
  const groups = (['food', 'shopping', 'arts', 'parks'] as const).flatMap((id) => {
    const rows = listings.filter((listing) => groupOf(listing) === id).slice(0, 8)
    return rows.length > 0 ? [{ id, title: TITLES[id], rows }] : []
  })
  if (groups.length === 0) return null
  return (
    <>
      {groups.map((group) => (
        <PlaceGrid key={group.id} label={group.title} places={group.rows.map(placeCardFromListing)} />
      ))}
    </>
  )
}
