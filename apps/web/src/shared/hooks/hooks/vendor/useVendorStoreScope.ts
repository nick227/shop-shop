import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export type VendorStorePick = { readonly id: string; readonly name?: string }

const STORE_QUERY = 'storeId'

/**
 * Syncs `?storeId=` with the vendor people pages; auto-fills when missing or invalid.
 */
export function useVendorStoreScope(stores: readonly VendorStorePick[]) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const urlStoreId = searchParams.get(STORE_QUERY) ?? ''

  const selectedStoreId = useMemo(() => {
    if (stores.length === 0) return ''
    if (urlStoreId && stores.some((s) => s.id === urlStoreId)) return urlStoreId
    return stores[0]!.id
  }, [stores, urlStoreId])

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
      const next = new URLSearchParams(searchParams)
      next.set(STORE_QUERY, storeId)
      navigate({ pathname: location.pathname, search: `?${next.toString()}` })
    },
    [stores, searchParams, navigate, location.pathname]
  )

  const selectedStore = useMemo(
    () => (selectedStoreId ? stores.find((s) => s.id === selectedStoreId) : undefined),
    [stores, selectedStoreId]
  )

  return { selectedStoreId, selectedStore, setSelectedStoreId, storeQueryParam: STORE_QUERY }
}
