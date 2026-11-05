import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { realPhoto } from '../discovery/photo'
import { creditForUrl } from '../discovery/editorialMedia'
import { neighborhoodPath, type NeighborhoodCard } from './neighborhoodHero'
import { placeTone } from './placeTone'

export type PlaceCardData = {
  readonly id: string
  readonly href: string
  readonly name: string
  readonly category?: string
  readonly categoryLabel: string
  readonly meta?: string | null
  readonly imageUrl?: string | null
  readonly credit?: string | null
}

export type PlaceCardVariant = 'auto' | 'neighborhood' | 'business' | 'attraction' | 'feature'

export function placeCardFromNeighborhood(area: NeighborhoodCard & {
  readonly city?: { readonly name: string; readonly state?: string | null } | null
  readonly postalCodes?: readonly string[]
}): PlaceCardData {
  const meta = [area.headline, area.city?.name, area.postalCodes?.join(', ')].filter(Boolean).join(' · ')
  const photo = realPhoto(area.coverUrl)
  return {
    id: area.id,
    href: neighborhoodPath(area.slug),
    name: area.name,
    categoryLabel: 'Neighborhood',
    meta: meta || null,
    imageUrl: photo ?? null,
    credit: photo ? creditForUrl(photo) ?? null : null,
  }
}

export function placeCardFromStore(store: {
  readonly id: string
  readonly name: string
  readonly typeLabel?: string
  readonly image?: string | null
  readonly distance?: number
}): PlaceCardData {
  return {
    id: store.id,
    href: getStoreRoute({ id: store.id, name: store.name }),
    name: store.name,
    category: 'RETAIL',
    categoryLabel: store.typeLabel ?? 'Shop',
    meta: store.distance == null ? null : `${store.distance.toFixed(1)} mi`,
    imageUrl: realPhoto(store.image) ?? null,
  }
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
    imageUrl: realPhoto(listing.coverUrl) ?? null,
  }
}

export function PlaceCard({
  place,
  feature = false,
  variant = 'auto',
}: {
  readonly place: PlaceCardData
  readonly feature?: boolean
  readonly variant?: PlaceCardVariant
}) {
  const [failed, setFailed] = useState(false)
  const photoUrl = realPhoto(place.imageUrl)
  const photo = Boolean(photoUrl) && !failed
  const tone = placeTone(place.category, place.categoryLabel)

  const resolvedVariant: Exclude<PlaceCardVariant, 'auto'> =
    variant !== 'auto'
      ? variant
      : place.categoryLabel === 'Neighborhood'
        ? 'neighborhood'
        : tone === 'outdoors' || tone === 'arts'
          ? 'attraction'
          : 'business'

  if (resolvedVariant === 'neighborhood') {
    return (
      <Link
        to={place.href}
        className={`place-card is-neighborhood tone-${tone}${feature ? ' is-feature' : ''}${photo ? ' has-photo' : ' is-quiet'}`}
      >
        {photo ? <img src={photoUrl ?? ''} alt="" onError={() => setFailed(true)} /> : null}
        <span className="place-card-copy">
          <strong>{place.name}</strong>
          {place.meta ? <span>{place.meta}</span> : null}
          {photo && place.credit ? <span className="media-credit">{place.credit}</span> : null}
        </span>
      </Link>
    )
  }

  if (resolvedVariant === 'attraction') {
    return (
      <Link
        to={place.href}
        className={`place-card is-attraction tone-${tone}${feature ? ' is-feature' : ''}${photo ? ' has-photo' : ' is-guide'}`}
      >
        {photo ? <img src={photoUrl ?? ''} alt="" onError={() => setFailed(true)} /> : null}
        <span className="place-card-copy">
          <span className="place-card-kicker">{place.categoryLabel}</span>
          <strong>{place.name}</strong>
          {place.meta ? <span>{place.meta}</span> : null}
        </span>
      </Link>
    )
  }

  return (
    <Link
      to={place.href}
      className={`place-card is-business tone-${tone}${feature ? ' is-feature' : ''}${photo ? ' has-photo' : ' is-quiet'}`}
    >
      {photo ? <img src={photoUrl ?? ''} alt="" onError={() => setFailed(true)} /> : null}
      <span className="place-card-copy">
        <span className="place-card-kicker">{place.categoryLabel}</span>
        <strong>{place.name}</strong>
        {place.meta ? <span>{place.meta}</span> : null}
      </span>
    </Link>
  )
}
