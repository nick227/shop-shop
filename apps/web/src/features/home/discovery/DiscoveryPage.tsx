import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PublicMaintenanceBanner } from '@features/home/components'
import { useNeighborhoodData } from '../neighborhood/useNeighborhoodData'
import { useSignedInHome } from '../neighborhood/useSignedInHome'
import { defaultAddressZip } from '../neighborhood/signedInSelect'
import { HOME_RADIUS_MILES, placeZip, rememberedPlace } from '../shell/placeMemory'
import { CategoryColumn } from './CategoryColumn'
import { DetailPanel } from './DetailPanel'
import { Masonry } from './Masonry'
import { LocationHero } from './Opening'
import { composeDiscovery, mapPoints, type DiscoveryItem, type DiscoveryTile } from './tiles'
import './discovery.css'

export function DiscoveryPage({ mode }: { readonly mode: 'home' | 'explore' }) {
  const [params, setParams] = useSearchParams()
  const data = useNeighborhoodData()
  const account = useSignedInHome()
  const accountZip = defaultAddressZip(account.addresses)
  const [selected, setSelected] = useState<{ tile: DiscoveryTile; anchor?: DOMRect } | undefined>()

  useEffect(() => {
    const zip = params.get('zip') ?? new URLSearchParams(rememberedPlace()).get('zip') ?? accountZip
    if (!zip) return
    if (params.get('zip') === zip && params.get('radius') === String(HOME_RADIUS_MILES)) return
    const next = new URLSearchParams(params)
    next.set('zip', zip)
    next.set('radius', String(HOME_RADIUS_MILES))
    setParams(next, { replace: true })
  }, [accountZip, params, setParams])

  const browse = params.get('browse') ?? ''
  const query = params.get('q') ?? ''
  const shownZip = data.location?.zip || placeZip(params.toString()) || accountZip || ''
  const composed = useMemo(() => composeDiscovery({
    stores: data.stores,
    products: data.products as DiscoveryItem[],
    stories: data.stories,
    browse,
    query,
  }), [browse, data.products, data.stores, data.stories, query])
  const points = useMemo(() => mapPoints(composed.places), [composed.places])

  const openStore = (id: string) => {
    const tile = composed.tiles.find((entry) => entry.kind === 'store' && entry.id === id)
      ?? (composed.hero?.id === id ? composed.hero : undefined)
    if (tile) setSelected({ tile })
  }

  const related = selected?.tile.kind === 'store'
    ? composed.tiles.filter((entry): entry is DiscoveryTile & { kind: 'product' } => entry.kind === 'product' && entry.storeId === selected.tile.id)
    : []

  return (
    <div className="discover">
      <PublicMaintenanceBanner />
      <LocationHero
        mode={mode}
        city={data.location?.city}
        zip={shownZip}
        shopCount={composed.places.length}
        story={composed.stories[0]}
        nearest={composed.nearest}
        points={points}
        userLat={data.location?.latitude}
        userLng={data.location?.longitude}
        onSelectStore={openStore}
      />

      <div className="discover-workspace">
        <CategoryColumn />
        <Masonry
          tiles={composed.stories[0]
            ? composed.tiles.filter((tile) => tile.id !== composed.stories[0]?.id)
            : composed.tiles}
          onOpen={(tile, anchor) => setSelected({ tile, anchor })}
        />
      </div>

      {selected ? (
        <DetailPanel
          tile={selected.tile}
          anchor={selected.anchor}
          related={related}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </div>
  )
}
