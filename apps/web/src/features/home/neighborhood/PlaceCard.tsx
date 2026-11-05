import { useState } from 'react'
import { Link } from 'react-router-dom'
import { placeTone } from './placeTone'

export type PlaceCardData = {
  readonly id: string
  readonly href: string
  readonly name: string
  readonly category?: string
  readonly categoryLabel: string
  readonly meta?: string | null
  readonly imageUrl?: string | null
}

export function placeCardFromListing(listing: {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly category?: string
  readonly categoryLabel: string
  readonly addressStreet?: string | null
  readonly distance?: number | null
  readonly coverUrl?: string | null
  readonly merchant?: boolean
}): PlaceCardData {
  const bits = [
    listing.addressStreet,
    listing.distance == null ? null : `${listing.distance.toFixed(1)} mi`,
    listing.merchant ? 'Shop' : null,
  ].filter((bit): bit is string => Boolean(bit))
  return {
    id: listing.id,
    href: `/directory/${listing.slug}`,
    name: listing.name,
    category: listing.category,
    categoryLabel: listing.categoryLabel,
    meta: bits.join(' · ') || null,
    imageUrl: listing.coverUrl ?? null,
  }
}

export function PlaceCard({ place, feature = false }: { readonly place: PlaceCardData; readonly feature?: boolean }) {
  const [failed, setFailed] = useState(false)
  const photo = Boolean(place.imageUrl) && !failed
  const tone = placeTone(place.category, place.categoryLabel)
  return (
    <Link to={place.href} className={`place-card tone-${tone}${feature ? ' is-feature' : ''}${photo ? '' : ' is-mark'}`}>
      {photo ? <img src={place.imageUrl ?? ''} alt="" onError={() => setFailed(true)} /> : null}
      <span className="place-card-copy">
        <strong>{place.name}</strong>
        <span>{[place.categoryLabel, place.meta].filter(Boolean).join(' · ')}</span>
      </span>
    </Link>
  )
}
