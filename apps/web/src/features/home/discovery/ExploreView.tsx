import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { ItemResponse } from '@api/types'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { itemImage } from '@features/storefront/components/ProductTile'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { HOME_RADIUS_MILES, rememberedPlace, rememberZip } from '../shell/placeMemory'
import { realPhoto } from './photo'
import { NeighborhoodMap } from './NeighborhoodMap'
import { useNeighborhoodData } from '../neighborhood/useNeighborhoodData'
import { useDirectory } from '../neighborhood/useDirectory'
import { MemberShops } from '../neighborhood/MemberShops'
import { PlaceCard, placeCardFromListing, placeCardFromNeighborhood } from '../neighborhood/PlaceCard'
import { PlaceGrid, PlaceSkeleton } from '../neighborhood/PlaceGrid'
import { defaultAddressZip } from '../neighborhood/signedInSelect'
import { useSignedInHome } from '../neighborhood/useSignedInHome'
import './discovery.css'

const GROUPS = [
  { id: '', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'retail', label: 'Retail' },
  { id: 'out', label: 'Attractions' },
] as const

export function ExploreView() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const data = useNeighborhoodData()
  const account = useSignedInHome()
  const accountZip = defaultAddressZip(account.addresses, account.orders)
  const [draft, setDraft] = useState(params.get('q') ?? '')
  const q = params.get('q') ?? ''
  const group = params.get('group') ?? ''
  const directory = useDirectory(data.location?.latitude, data.location?.longitude, { q, group, limit: 40 })
  const listings = directory.data ?? []
  const products = ((data.products ?? []) as ItemResponse[]).filter((item) => !q || item.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8)

  useEffect(() => {
    const zip = params.get('zip') ?? new URLSearchParams(rememberedPlace()).get('zip') ?? accountZip
    if (!zip) return
    rememberZip(zip)
    if (params.get('zip') === zip && params.get('radius') === String(HOME_RADIUS_MILES)) return
    const next = new URLSearchParams(params)
    next.set('zip', zip)
    next.set('radius', String(HOME_RADIUS_MILES))
    setParams(next, { replace: true })
  }, [accountZip, params, setParams])

  const setGroup = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('group', id)
    else next.delete('group')
    setParams(next)
  }

  return (
    <div className="discover">
      <p className="tile-kicker">Explore {data.location?.city ?? 'Austin'}</p>
      <h1 className="business-name">Discover what’s local.</h1>
      <p className="discover-where">{data.location?.zip ? `Within ${HOME_RADIUS_MILES} miles of ${data.location.zip}` : 'Choose a ZIP to see places around you.'}</p>
      <form className="explore-search" onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); const text = draft.trim(); if (text) next.set('q', text); else next.delete('q'); setParams(next) }}>
        <input value={draft} placeholder="Search places, neighborhoods, products" onChange={(event) => setDraft(event.target.value)} />
        <button type="submit">Search</button>
      </form>
      <div className="explore-filters" role="toolbar" aria-label="Categories">
        {GROUPS.map((entry) => (
          <button key={entry.id || 'all'} type="button" aria-pressed={(entry.id || '') === group} className={entry.id === group ? 'is-on' : ''} onClick={() => setGroup(entry.id)}>{entry.label}</button>
        ))}
      </div>
      <div className="explore-layout">
        <div>
          {data.neighborhoods.length > 0 && !q && !group ? (
            <section className="place-band" aria-label={data.location?.zip ? 'Neighborhoods in this ZIP' : 'Austin neighborhoods'}>
              <p className="tile-kicker">{data.location?.zip ? 'Neighborhoods in this ZIP' : 'Austin neighborhoods'}</p>
              <div className="place-row">
                {data.neighborhoods.map((area) => (
                  <PlaceCard key={area.id} place={placeCardFromNeighborhood(area)} />
                ))}
              </div>
              <p className="discover-lede">A ZIP can include more than one neighborhood. <Link to="/neighborhoods">Browse the city</Link></p>
            </section>
          ) : null}
          <MemberShops stores={data.stores.slice(0, 8).map((store) => {
            const photo = store as typeof store & { imageUrl?: string | null; mediaAssets?: readonly { url?: string | null }[]; distance?: number }
            return {
              id: store.id,
              name: store.name,
              typeLabel: 'Shop',
              distance: photo.distance,
              image: realPhoto(photo.mediaAssets?.find((asset) => asset.url)?.url) ?? realPhoto(photo.imageUrl),
            }
          })} />
          {directory.isLoading ? <PlaceSkeleton /> : <PlaceGrid places={listings.map(placeCardFromListing)} label={q ? `Directory matching “${q}”` : 'Directory'} featureFirst />}
          {!directory.isLoading && listings.length === 0 ? <p className="discover-lede">Directory listings show up here after an admin publishes them.</p> : null}
          {products.length > 0 ? (
            <section className="place-band" aria-label="Products">
              <p className="tile-kicker">From shops</p>
              <div className="place-row">
                {products.map((item) => (
                  <PlaceCard key={item.id} place={{ id: item.id, href: getItemRouteSimple({ id: item.id, title: item.title }), name: item.title, categoryLabel: 'Product', meta: formatCurrency(parsePrice(item.price)), imageUrl: itemImage(item) ?? null }} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <div className="explore-map">
          <NeighborhoodMap
            points={listings.flatMap((listing) => listing.latitude == null || listing.longitude == null ? [] : [{ id: listing.slug, name: listing.name, latitude: listing.latitude, longitude: listing.longitude }])}
            userLat={data.location?.latitude}
            userLng={data.location?.longitude}
            onSelect={(id) => navigate(`/directory/${id}`)}
          />
        </div>
      </div>
    </div>
  )
}
