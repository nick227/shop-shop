import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export type VendorStorePick = { readonly id: string; readonly name?: string }

const STORE_QUERY = 'storeId'

const VENDOR_STORE_PATH = /^\/vendor\/stores\/([^/]+)(\/.*)?$/

function pathStoreIdFromLocation(pathname: string, stores: readonly VendorStorePick[]): string {
  const match = pathname.match(VENDOR_STORE_PATH)
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

  const selectedStoreId = useMemo(() => {
    if (stores.length === 0) return ''
    if (urlStoreId && stores.some((s) => s.id === urlStoreId)) return urlStoreId
    if (pathStoreId) return pathStoreId
    return stores[0]!.id
  }, [stores, urlStoreId, pathStoreId])

  useEffect(() => {
    if (stores.length === 0) return
    const urlValid = urlStoreId && stores.some((s) => s.id === urlStoreId)
    if (urlValid) return
    const next = new URLSearchParams(searchParams)
    next.set(STORE_QUERY, selectedStoreId)
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true })
  }, [stores, urlStoreId, selectedStoreId, searchParams, navigate, location.pathname])

  const setSelectedStoreId = useCallback(
    (storeId: string) => {
      if (!stores.some((s) => s.id === storeId)) return
      const pathMatch = location.pathname.match(/^(\/vendor\/stores\/)[^/]+(\/.*)?$/)
      let pathname = location.pathname
      if (pathMatch) {
        const [, prefix, suffix] = pathMatch
        pathname = `${prefix}${storeId}${suffix ?? ''}`
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
