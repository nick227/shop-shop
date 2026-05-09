import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export interface VendorStorePick {
  readonly id: string
  readonly name?: string
}

const STORE_QUERY = 'storeId'

const VENDOR_STORE_PATH = /^\/vendor\/stores\/([^/]+)(\/.*)?$/

function pathStoreIdFromLocation(pathname: string, stores: readonly VendorStorePick[]): string {
  const match = VENDOR_STORE_PATH.exec(pathname)
  const id = match?.[1]
  if (id && stores.some((s) => s.id === id)) return id
  return ''
}

/**
 * Syncs `?storeId=` across vendor routes; respects `/vendor/stores/:id/...` path; auto-fills when missing or invalid.
 */
export function useVendorStoreScope(stores: readonly VendorStorePick[]) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const urlStoreId = searchParams.get(STORE_QUERY) ?? ''
  const pathStoreId = useMemo(
    () => pathStoreIdFromLocation(location.pathname, stores),
    [location.pathname, stores]
  )

  // Stable set of store IDs — prevents effect from firing on refetch when stores haven't changed
  const storeIdSet = useMemo(() => new Set(stores.map((s) => s.id)), [stores])
  const storeIdsKey = useMemo(() => [...storeIdSet].sort().join(','), [storeIdSet])

  // Track the last explicitly confirmed selection so we don't fall back to stores[0] on refetch
  const lastValidSelectionRef = useRef<string>('')

  const selectedStoreId = useMemo(() => {
    if (stores.length === 0) return ''
    if (urlStoreId && storeIdSet.has(urlStoreId)) return urlStoreId
    if (pathStoreId) return pathStoreId
    // Preserve last known selection across refetches before falling back to first store
    if (lastValidSelectionRef.current && storeIdSet.has(lastValidSelectionRef.current)) {
      return lastValidSelectionRef.current
    }
    return stores[0]?.id ?? ''
  }, [stores, urlStoreId, pathStoreId, storeIdSet])

  // Keep the ref in sync whenever we have a confirmed valid selection
  useEffect(() => {
    if (selectedStoreId) lastValidSelectionRef.current = selectedStoreId
  }, [selectedStoreId])

  useEffect(() => {
    if (stores.length === 0) return
    const urlValid = urlStoreId && storeIdSet.has(urlStoreId)
    if (urlValid) return
    const next = new URLSearchParams(searchParams)
    next.set(STORE_QUERY, selectedStoreId)
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true })
  }, [storeIdsKey, urlStoreId, selectedStoreId, searchParams, navigate, location.pathname, storeIdSet])

  const setSelectedStoreId = useCallback(
    (storeId: string) => {
      if (!stores.some((s) => s.id === storeId)) return
      const pathMatch = VENDOR_STORE_PATH.exec(location.pathname)
      let pathname = location.pathname
      if (pathMatch) {
        const pathRest = pathMatch[2]
        pathname = `/vendor/stores/${storeId}${pathRest ?? ''}`
      }
      const next = new URLSearchParams(searchParams)
      next.set(STORE_QUERY, storeId)
      navigate({ pathname, search: `?${next.toString()}` })
    },
    [stores, searchParams, navigate, location.pathname]
  )

  const selectedStore = useMemo(
    () => (selectedStoreId ? stores.find((s) => s.id === selectedStoreId) : undefined),
    [stores, selectedStoreId]
  )

  return { selectedStoreId, selectedStore, setSelectedStoreId, storeQueryParam: STORE_QUERY }
}
