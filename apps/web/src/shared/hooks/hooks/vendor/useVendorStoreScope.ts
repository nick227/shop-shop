import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { storeIdFromPath, vendorPaths, withStore } from '@shared/lib/utils/navigation/vendorPaths'

export interface VendorStorePick {
  readonly id: string
  readonly name?: string
}

const LAST_STORE_KEY = 'vendor:lastStoreId'

/** The store the user last worked in on this device, if storage is available. */
export function readLastStoreId(): string {
  try {
    return localStorage.getItem(LAST_STORE_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeLastStoreId(storeId: string) {
  try {
    localStorage.setItem(LAST_STORE_KEY, storeId)
  } catch {
    // Storage blocked; the path still carries the store.
  }
}

/**
 * The active store: the `/vendor/:storeId` path segment when it names one of your stores,
 * otherwise the store you last worked in, otherwise your first store.
 */
export function useVendorStoreScope(stores: readonly VendorStorePick[]) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const pathStoreId = useMemo(() => {
    const id = storeIdFromPath(pathname)
    return id && stores.some((s) => s.id === id) ? id : ''
  }, [pathname, stores])

  const selectedStoreId = useMemo(() => {
    if (pathStoreId) return pathStoreId
    const remembered = readLastStoreId()
    if (remembered && stores.some((s) => s.id === remembered)) return remembered
    return stores[0]?.id ?? ''
  }, [pathStoreId, stores])

  useEffect(() => {
    if (pathStoreId) writeLastStoreId(pathStoreId)
  }, [pathStoreId])

  const setSelectedStoreId = useCallback(
    (storeId: string) => {
      if (!stores.some((s) => s.id === storeId)) return
      navigate(pathStoreId ? withStore(pathname, storeId) : vendorPaths.overview(storeId))
    },
    [stores, navigate, pathStoreId, pathname],
  )

  return { selectedStoreId, setSelectedStoreId, pathStoreId }
}
