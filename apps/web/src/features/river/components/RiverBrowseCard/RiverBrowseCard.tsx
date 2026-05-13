import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useStore } from '@shared/hooks/hooks/useStores'
import { useItems } from '@shared/hooks/generated'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { useRiverBrowseStores } from '@features/river/hooks/useRiverBrowseStores'
import { groupItemsByMenuType } from '@features/products/utils/groupItemsByMenuType'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { cn } from '@shared/lib/cn'
import {
  getBrowserGeolocationBlockReason,
  messageForGeolocationPositionError,
} from '@shared/lib/utils/geolocationBrowser'
import type { StoreWithDistance } from '@api/types'
import type { StoreSearchResult } from '@features/search/hooks/useUnifiedSearchApi'
import { RiverHero } from '../RiverHero/RiverHero'
import { RiverBrowseDetailColumn } from './RiverBrowseDetailColumn'

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 300_000,
  timeout: 15_000,
}

const AUTO_ADVANCE_MS = 10_000

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max)
}

function pickRandomStoreId(
  stores: readonly StoreSearchResult[],
  currentId: string | undefined,
): string | undefined {
  if (stores.length === 0) return undefined

  const candidates = stores.filter((store) => store.id !== currentId)
  if (candidates.length > 0) {
    return candidates[randomIndex(candidates.length)].id
  }

  return currentId
}

export interface RiverBrowseCardProps {
  readonly featuredStore: StoreWithDistance | null | undefined
  readonly featuredLoading: boolean
}

export function RiverBrowseCard({ featuredStore, featuredLoading }: RiverBrowseCardProps) {
  const [storeTypeFilter, setStoreTypeFilter] = useState('')
  const [nearMe, setNearMe] = useState(false)
  const [userLat, setUserLat] = useState<number | undefined>()
  const [userLng, setUserLng] = useState<number | undefined>()
  const [geoPending, setGeoPending] = useState(false)
  const [geoHint, setGeoHint] = useState<string | undefined>()
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>()
  const [autoAdvanceActive, setAutoAdvanceActive] = useState(true)

  const cancelAutoAdvance = useCallback(() => {
    setAutoAdvanceActive(false)
  }, [])

  const awaitingGeo = nearMe && (userLat === undefined || userLng === undefined)

  const { data, isLoading, error, isFetching } = useRiverBrowseStores({
    storeTypeFilter,
    nearMe,
    latitude: userLat,
    longitude: userLng,
  })

  const listStores = useMemo(
    () => (awaitingGeo ? [] : (data?.sections.stores.results ?? [])),
    [awaitingGeo, data?.sections.stores.results],
  )

  useEffect(() => {
    if (listStores.length === 0) {
      setSelectedStoreId(undefined)
      return
    }
    setSelectedStoreId((prev) =>
      prev && listStores.some((store) => store.id === prev)
        ? prev
        : pickRandomStoreId(listStores, prev),
    )
  }, [listStores])

  const requestLocation = useCallback(() => {
    setGeoPending(true)
    // User opted in via "Within 25 miles of me"
    // eslint-disable-next-line sonarjs/no-intrusive-permissions -- explicit opt-in checkbox
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setGeoPending(false)
        setGeoHint(undefined)
      },
      (error: GeolocationPositionError) => {
        const msg = messageForGeolocationPositionError(error)
        setGeoHint(msg)
        toast.error(msg)
        setGeoPending(false)
        setNearMe(false)
        setUserLat(undefined)
        setUserLng(undefined)
      },
      GEO_OPTIONS,
    )
  }, [])

  const startNearMe = useCallback(() => {
    const block = getBrowserGeolocationBlockReason()
    if (block) {
      setGeoHint(block)
      toast.error(block)
      return
    }
    setGeoHint(undefined)
    setNearMe(true)
    requestLocation()
  }, [requestLocation])

  const stopNearMe = useCallback(() => {
    setNearMe(false)
    setUserLat(undefined)
    setUserLng(undefined)
    setGeoHint(undefined)
  }, [])

  const { data: detailStore, isLoading: detailStoreLoading } = useStore(selectedStoreId ?? '')
  const { data: detailItems, isLoading: detailItemsLoading } = useItems(
    selectedStoreId ? { storeId: selectedStoreId } : undefined,
    { enabled: Boolean(selectedStoreId) },
  )

  const menuSections = useMemo(
    () => groupItemsByMenuType(detailItems ?? []),
    [detailItems],
  )

  const browseLoading = !awaitingGeo && (isLoading || isFetching)

  useEffect(() => {
    if (!autoAdvanceActive || listStores.length < 2 || browseLoading || awaitingGeo) {
      return
    }
    const timer = window.setInterval(() => {
      setSelectedStoreId((prev) => pickRandomStoreId(listStores, prev))
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [autoAdvanceActive, listStores, browseLoading, awaitingGeo])

  const detailStoreSynced = detailStore?.id === selectedStoreId
  const itemsSynced =
    !detailItemsLoading &&
    (detailItems === undefined ||
      detailItems.length === 0 ||
      detailItems[0]?.storeId === selectedStoreId)

  const showDetailError = Boolean(
    selectedStoreId && !detailStoreLoading && !detailItemsLoading && !detailStore,
  )
  const showDetailSkeleton = Boolean(
    selectedStoreId &&
      !showDetailError &&
      (detailStoreLoading ||
        detailItemsLoading ||
        !detailStore ||
        !detailStoreSynced ||
        !itemsSynced),
  )

  const detailStoreRoute =
    detailStore && detailStoreSynced ? getStoreRoute({ id: detailStore.id, name: detailStore.name }) : ''

  const heroPick = useMemo(() => {
    if (selectedStoreId) {
      const fromList = listStores.find((store) => store.id === selectedStoreId)
      if (fromList) return fromList
      if (detailStoreSynced && detailStore) return detailStore
      return undefined
    }
    return featuredStore ?? undefined
  }, [selectedStoreId, listStores, detailStoreSynced, detailStore, featuredStore])

  const heroIsLoading = Boolean(
    heroPick === undefined &&
      (featuredLoading ||
        browseLoading ||
        (Boolean(selectedStoreId) && detailStoreLoading)),
  )

  const handleChipFilter = useCallback(
    (value: string) => {
      cancelAutoAdvance()
      setStoreTypeFilter(value)
    },
    [cancelAutoAdvance],
  )

  const handleNearMeCheckbox = useCallback(
    (checked: boolean) => {
      cancelAutoAdvance()
      if (checked) {
        startNearMe()
        return
      }
      stopNearMe()
    },
    [cancelAutoAdvance, startNearMe, stopNearMe],
  )

  return (
    <section
      className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      aria-labelledby="river-browse-heading"
    >
      <header className="border-b border-gray-100 p-4">
        <h2 id="river-browse-heading" className="mb-3 text-lg font-semibold tracking-tight text-gray-900">
          Browse kitchens
        </h2>
        <div className="mb-3 flex flex-wrap gap-2" role="toolbar" aria-label="Kitchen type">
          {STORE_TYPE_CONFIG.map(({ value, label, Icon }) => {
            const active = storeTypeFilter === value
            return (
              <button
                key={value || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => handleChipFilter(value)}
                className={cn(
                  'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-orange-500 bg-orange-50 text-gray-900'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-300',
                )}
              >
                <Icon className="h-3.5 w-3.5 text-gray-600" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={nearMe}
            disabled={geoPending}
            onChange={(e) => handleNearMeCheckbox(e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          Within 25 miles of me
        </label>
        {geoHint ? (
          <p role="alert" className="mt-2 text-xs leading-snug text-amber-900">
            {geoHint}
          </p>
        ) : undefined}
      </header>

      <div className="min-h-[660px] bg-white">
        <RiverHero
          store={heroPick}
          isLoading={heroIsLoading}
          embedded
          onInteraction={cancelAutoAdvance}
        />
        <RiverBrowseDetailColumn
          selectedStoreId={selectedStoreId}
          showDetailError={showDetailError}
          showDetailSkeleton={showDetailSkeleton}
          detailStore={detailStore}
          detailStoreRoute={detailStoreRoute}
          menuSections={menuSections}
          emptyMessage={
            awaitingGeo && geoPending
              ? 'Getting your location...'
              : error?.message ??
                (browseLoading ? 'Finding a kitchen...' : 'Random kitchens will appear here.')
          }
          onUserInteract={cancelAutoAdvance}
        />
      </div>
    </section>
  )
}
