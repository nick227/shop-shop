import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { LocationData } from '@shared/types'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { DetailPanel } from '../discovery/DetailPanel'
import { MarketFeed } from '../discovery/MarketFeed'
import { NeighborhoodMap } from '../discovery/NeighborhoodMap'
import { composeDiscovery, mapPoints, type DiscoveryItem, type DiscoveryTile } from '../discovery/tiles'
import '../discovery/discovery.css'
import { NeighborhoodGuide } from './NeighborhoodGuide'
import { PlaceCard, placeCardFromNeighborhood } from './PlaceCard'
import { type NeighborhoodCard } from './neighborhoodHero'
import { apiOrigin, loadProducts, loadStores, loadStories } from './loadDiscovery'

type NeighborhoodProfile = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly headline: string | null
  readonly about: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly city: { readonly name: string; readonly state: string | null }
  readonly postalCodes: readonly string[]
  readonly images: readonly string[]
  readonly videos: readonly string[]
  readonly nearby: readonly NeighborhoodCard[]
}

async function loadProfile(slug: string): Promise<NeighborhoodProfile | null> {
  const response = await fetch(`${apiOrigin()}/api/places/${slug}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Could not load this neighborhood')
  return response.json() as Promise<NeighborhoodProfile>
}

export function NeighborhoodProfile() {
  const { slug = '' } = useParams()
  const [selected, setSelected] = useState<{ tile: DiscoveryTile; anchor?: DOMRect } | undefined>()
  const profileQuery = useQuery({
    queryKey: ['neighborhood-profile', slug],
    enabled: slug.length > 0,
    queryFn: () => loadProfile(slug),
  })
  const profile = profileQuery.data
  const location = profile?.latitude != null && profile.longitude != null
    ? { latitude: profile.latitude, longitude: profile.longitude, radiusMiles: HOME_RADIUS_MILES, source: 'manual' as const }
    : undefined

  const stores = useQuery({
    queryKey: ['neighborhood-stores', slug, location?.latitude, location?.longitude],
    enabled: Boolean(location),
    queryFn: () => loadStores(location as LocationData),
  })
  const products = useQuery({
    queryKey: ['neighborhood-products', slug, location?.latitude, location?.longitude],
    enabled: Boolean(location),
    queryFn: () => loadProducts(location as LocationData),
  })
  const stories = useQuery({
    queryKey: ['neighborhood-stories', slug, location?.latitude, location?.longitude],
    enabled: Boolean(location),
    queryFn: () => loadStories(location),
  })

  const composed = useMemo(() => composeDiscovery({
    stores: stores.data ?? [],
    products: (products.data ?? []) as DiscoveryItem[],
    stories: stories.data ?? [],
    browse: '',
    query: '',
  }), [products.data, stores.data, stories.data])
  const points = useMemo(() => mapPoints(composed.places), [composed.places])
  const related = selected?.tile.kind === 'store'
    ? composed.tiles.filter((entry): entry is DiscoveryTile & { kind: 'product' } => entry.kind === 'product' && entry.storeId === selected.tile.id)
    : []

  if (profileQuery.isLoading) return <p className="discover discover-lede">Looking up this neighborhood…</p>
  if (!profile) return <p className="discover discover-lede">This neighborhood is not published.</p>

  const cityLine = profile.city.state ? `${profile.city.name}, ${profile.city.state}` : profile.city.name
  const open = (tile: DiscoveryTile, anchor?: DOMRect) => setSelected({ tile, anchor })

  return (
    <div className="discover">
      <section className="discover-hero" aria-label={profile.name}>
        <div className="hero-copy">
          <p className="tile-kicker">{cityLine}</p>
          <h1 className="discover-display">{profile.name}</h1>
          <p className="discover-where">A neighborhood in {profile.city.name}</p>
          {profile.headline ? <p className="discover-lede">{profile.headline}</p> : null}
          {profile.about ? <p className="discover-lede">{profile.about}</p> : null}
          {profile.images.length > 0 ? (
            <div className="place-gallery">
              {profile.images.map((url) => <img key={url} src={url} alt="" />)}
            </div>
          ) : null}
          {profile.videos.length > 0 ? (
            <ul className="hero-areas">
              {profile.videos.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">Video</a></li>)}
            </ul>
          ) : null}
          {profile.postalCodes.length > 0 ? (
            <p className="discover-lede">Associated ZIP codes: {profile.postalCodes.join(', ')}. A ZIP can cover more than one neighborhood, so these codes are not a boundary.</p>
          ) : null}
        </div>
        <div className="hero-map">
          <NeighborhoodMap points={points} userLat={profile.latitude ?? undefined} userLng={profile.longitude ?? undefined} onSelect={(id) => {
            const tile = composed.tiles.find((entry) => entry.kind === 'store' && entry.id === id)
            if (tile) open(tile)
          }} />
        </div>
      </section>
      {profile.nearby.length > 0 ? (
        <div className="place-row">
          {profile.nearby.map((area) => (
            <PlaceCard key={area.id} place={placeCardFromNeighborhood(area)} />
          ))}
        </div>
      ) : null}
      <NeighborhoodGuide slug={profile.slug} />
      {location ? (
        <MarketFeed tiles={composed.tiles} nearest={composed.nearest} onOpen={open} />
      ) : null}
      {selected ? (
        <DetailPanel tile={selected.tile} anchor={selected.anchor} related={related} onClose={() => setSelected(undefined)} />
      ) : null}
    </div>
  )
}
