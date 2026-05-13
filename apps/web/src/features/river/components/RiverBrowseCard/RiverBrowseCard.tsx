import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { useStore } from '@shared/hooks/hooks/useStores'
import { useItems } from '@shared/hooks/generated'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { useRiverBrowseStores } from '@features/river/hooks/useRiverBrowseStores'
import { StoreHeader } from '@features/stores/components/StoreHeader'
import { ItemCard } from '@features/products/components/ItemCard'
import { groupItemsByMenuType } from '@features/products/utils/groupItemsByMenuType'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { formatDistance } from '@shared/lib/utils/format'
import { cn } from '@shared/lib/cn'

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 60_000,
  timeout: 12_000,
}

export function RiverBrowseCard() {
  const [storeTypeFilter, setStoreTypeFilter] = useState('')
  const [nearMe, setNearMe] = useState(false)
  const [userLat, setUserLat] = useState<number | undefined>()
  const [userLng, setUserLng] = useState<number | undefined>()
  const [geoPending, setGeoPending] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>()

  const awaitingGeo = nearMe && (userLat == null || userLng == null)

  const { data, isLoading, error, isFetching } = useRiverBrowseStores({
    storeTypeFilter,
    nearMe,
    latitude: userLat,
    longitude: userLng,
  })

  const listStores = awaitingGeo ? [] : (data?.sections.stores.results ?? [])

  useEffect(() => {
    if (listStores.length === 0) {
      setSelectedStoreId(undefined)
      return
    }
    setSelectedStoreId((prev) =>
      prev && listStores.some((s) => s.id === prev) ? prev : listStores[0].id,
    )
  }, [listStores])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported in this browser.')
      return
    }
    setGeoPending(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setGeoPending(false)
      },
      () => {
        toast.error('Could not read your location.')
        setGeoPending(false)
        setNearMe(false)
        setUserLat(undefined)
        setUserLng(undefined)
      },
      GEO_OPTIONS,
    )
  }, [])

  const onNearMeChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        setNearMe(true)
        requestLocation()
      } else {
        setNearMe(false)
        setUserLat(undefined)
        setUserLng(undefined)
      }
    },
    [requestLocation],
  )

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
  const detailLoading = Boolean(selectedStoreId) && (detailStoreLoading || detailItemsLoading)
  const detailStoreRoute =
    detailStore ? getStoreRoute({ id: detailStore.id, name: detailStore.name }) : ''

  return (
    <section
      className="overflow-hidden w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
      aria-labelledby="river-browse-heading"
    >
      <div className="p-4 border-b border-gray-100">
        <h2 id="river-browse-heading" className="mb-3 text-lg font-semibold tracking-tight text-gray-900">
          Browse kitchens
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {STORE_TYPE_CONFIG.map(({ value, label, Icon }) => {
            const active = storeTypeFilter === value
            return (
              <button
                key={value || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => setStoreTypeFilter(value)}
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
        <label className="flex gap-2 items-center text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={nearMe}
            disabled={geoPending}
            onChange={(e) => onNearMeChange(e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          Within 25 miles of me
        </label>
      </div>

      <div className="grid min-h-[280px] divide-y divide-gray-100 md:grid-cols-2 md:divide-y-0 md:divide-x md:divide-gray-100">
        <div className="flex flex-col min-h-0 bg-gray-50/50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Matches
          </div>
          <div className="overflow-y-auto flex-1 max-h-[min(420px,50vh)] p-2">
            {awaitingGeo && geoPending ? (
              <p className="p-3 text-sm text-gray-600">Getting your location…</p>
            ) : error ? (
              <p className="p-3 text-sm text-red-600">{error.message}</p>
            ) : browseLoading ? (
              <ul className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="h-12 rounded-lg bg-gray-200 animate-pulse" />
                ))}
              </ul>
            ) : listStores.length === 0 ? (
              <p className="p-3 text-sm text-gray-600">No kitchens match this filter yet.</p>
            ) : (
              <ul className="space-y-1">
                {listStores.map((s) => {
                  const selected = s.id === selectedStoreId
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-selected={selected}
                        onClick={() => setSelectedStoreId(s.id)}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          selected ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-white/80',
                        )}
                      >
                        <span className="font-medium text-gray-900">{s.name}</span>
                        {nearMe && s.distance != null ? (
                          <span className="flex gap-1 items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            {formatDistance(s.distance)}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Selected kitchen
          </div>
          <div className="overflow-y-auto flex-1 max-h-[min(420px,50vh)] p-3">
            {!selectedStoreId ? (
              <p className="text-sm text-gray-600">Choose a kitchen from the list.</p>
            ) : detailLoading ? (
              <div className="space-y-3">
                <div className="h-16 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-24 rounded-lg bg-gray-200 animate-pulse" />
              </div>
            ) : !detailStore ? (
              <p className="text-sm text-gray-600">Could not load this kitchen.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <StoreHeader store={detailStore} showMap={false} fullSize={false} />
                  <Link
                    to={detailStoreRoute}
                    className="mt-3 inline-flex text-sm font-medium text-orange-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded"
                  >
                    Open full kitchen page →
                  </Link>
                </div>

                {menuSections.length === 0 ? (
                  <p className="text-sm text-gray-600">No menu items to preview.</p>
                ) : (
                  menuSections.map((section) => (
                    <section key={section.label}>
                      <h3 className="mb-2 text-sm font-semibold text-gray-900">{section.label}</h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {section.items.map((item) => (
                          <ItemCard key={item.id} item={item} store={{ id: detailStore.id, name: detailStore.name }} />
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
