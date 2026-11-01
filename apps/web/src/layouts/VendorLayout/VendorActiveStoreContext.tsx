/* eslint-disable react-refresh/only-export-components -- provider + hook belong together for vendor shell */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useVendorStoreScope } from '@shared/hooks/hooks/vendor/useVendorStoreScope'
import type { VendorStore } from '@shared/hooks/hooks/vendor'

export type VendorActiveStoreContextValue = Omit<ReturnType<typeof useVendorStoreScope>, 'selectedStore'> & {
  readonly stores: readonly VendorStore[]
  readonly selectedStore: VendorStore | undefined
}

const VendorActiveStoreContext = createContext<VendorActiveStoreContextValue | undefined>(undefined)

export function VendorActiveStoreProvider({
  stores,
  children,
}: {
  readonly stores: readonly VendorStore[]
  readonly children: ReactNode
}) {
  const scope = useVendorStoreScope(stores)
  const value = useMemo(
    () => ({
      ...scope,
      stores,
      selectedStore: stores.find((store) => store.id === scope.selectedStoreId),
    }),
    [scope, stores],
  )
  return (
    <VendorActiveStoreContext.Provider value={value}>{children}</VendorActiveStoreContext.Provider>
  )
}

export function useVendorActiveStore(): VendorActiveStoreContextValue {
  const ctx = useContext(VendorActiveStoreContext)
  if (!ctx) {
    throw new Error('useVendorActiveStore must be used within VendorActiveStoreProvider')
  }
  return ctx
}
