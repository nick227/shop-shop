/* eslint-disable react-refresh/only-export-components -- provider + hook belong together for vendor shell */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  useVendorStoreScope,
  type VendorStorePick,
} from '@shared/hooks/hooks/vendor/useVendorStoreScope'

export type VendorActiveStoreContextValue = ReturnType<typeof useVendorStoreScope> & {
  readonly stores: readonly VendorStorePick[]
}

const VendorActiveStoreContext = createContext<VendorActiveStoreContextValue | undefined>(undefined)

export function VendorActiveStoreProvider({
  stores,
  children,
}: {
  readonly stores: readonly VendorStorePick[]
  readonly children: ReactNode
}) {
  const scope = useVendorStoreScope(stores)
  const value = useMemo(() => ({ ...scope, stores }), [scope, stores])
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
