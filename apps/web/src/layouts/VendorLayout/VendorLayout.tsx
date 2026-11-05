import { canAccess } from './storeAccess'
import { useAccountCapabilities } from '@features/account/useAccountCapabilities'
/**
 * VendorLayout — the seller workspace.
 *
 * - One shell (AppShell): expanded sidebar, icon rail, phone drawer
 * - Store identity at the top of the sidebar; the person in the top-right menu
 * - Active store scope (URL + context), remembered per device
 * - No store yet: a bare frame around the create page, without the sidebar
 */
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button, Spinner } from '@shared/ui/primitives'
import { AppShell } from '@shared/ui/layout/AppShell'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useMemo, useState } from 'react'
import {
  readOrderAlertChoice,
  useVendorStores,
  useVendorRealtimeOrders,
  type VendorStore,
} from '@shared/hooks/hooks/vendor'
import { VendorActiveStoreProvider, useVendorActiveStore } from './VendorActiveStoreContext'
import { VendorSidebar } from './VendorSidebar'
import { VendorTopBar } from './VendorTopBar'
import { AccountMenu } from './AccountMenu'

const CREATE_STORE_PATHS: ReadonlySet<string> = new Set([vendorPaths.newStore])

function VendorWorkspace() {
  const { selectedStoreId, stores } = useVendorActiveStore()
  // Every store whose orders you may see; sound and desktop alerts follow each store's choice.
  const orderStores = useMemo(() => stores.filter((store) => canAccess(store, 'VIEW_ORDERS')), [stores])

  useVendorRealtimeOrders({
    storeIds: orderStores.map((store) => store.id),
    storeNames: Object.fromEntries(orderStores.map((store) => [store.id, store.name])),
    alertsFor: (storeId) => readOrderAlertChoice(storeId, selectedStoreId),
  })

  return (
    <AppShell
      navLabel="Store"
      storageKey="vendor:sidebarCollapsed"
      sidebar={<VendorSidebar />}
      topBar={<VendorTopBar />}
    >
      <Outlet />
    </AppShell>
  )
}

function FirstStoreFrame() {
  const { capabilities } = useAccountCapabilities()
  const { pathname } = useLocation()
  if (!capabilities?.canCreateStore) return <Navigate to="/" replace />
  if (!CREATE_STORE_PATHS.has(pathname)) {
    return <Navigate to={vendorPaths.newStore} replace />
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex min-h-14 items-center gap-3 border-b border-border px-4">
        <Link to="/" className="text-lg font-bold tracking-tight">
          ShopShop <span className="text-xs font-medium text-muted-foreground">for sellers</span>
        </Link>
        <span className="flex-1" />
        <AccountMenu />
      </header>
      <Outlet />
    </div>
  )
}

function StoresUnavailable({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-base font-semibold">Your stores could not be loaded</p>
      <p className="text-sm text-muted-foreground">Check your connection, then try again.</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

const NO_STORES: readonly VendorStore[] = []

export function VendorLayout() {
  const { data: stores = NO_STORES, isLoading, error, refetch } = useVendorStores()
  const { pathname } = useLocation()
  const onCreatePath = CREATE_STORE_PATHS.has(pathname)
  // A first store is created in place: swapping to the full workspace would remount the form and drop
  // what the seller has typed, so the bare frame stays until they leave the create page.
  const [inFirstStoreFlow, setInFirstStoreFlow] = useState(false)
  if (!inFirstStoreFlow && onCreatePath && !isLoading && stores.length === 0) setInFirstStoreFlow(true)
  if (inFirstStoreFlow && !onCreatePath) setInFirstStoreFlow(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    )
  }

  if (error) return <StoresUnavailable onRetry={() => void refetch()} />

  return (
    <VendorActiveStoreProvider stores={stores}>
      {stores.length === 0 || inFirstStoreFlow ? <FirstStoreFrame /> : <VendorWorkspace />}
    </VendorActiveStoreProvider>
  )
}
