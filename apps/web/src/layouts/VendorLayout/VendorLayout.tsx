/**
 * VendorLayout - Unified layout for all vendor pages
 *
 * Features:
 * - Persistent navigation (side nav)
 * - Centralized OrderCountWidget
 * - Active store scope (URL + context)
 * - Mobile responsive
 */

import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Button } from '@shared/ui/primitives'
import { OrderCountWidget } from '@features/orders/components/OrderCountWidget'
import { useVendorStores, useVendorRealtimeOrders } from '@shared/hooks/hooks/vendor'
import { VendorActiveStoreProvider, useVendorActiveStore } from './VendorActiveStoreContext'
import { VendorStoreSwitcher } from './VendorStoreSwitcher'
import { VendorSideNav } from './VendorSideNav'
import styles from './VendorLayout.module.css'

function VendorLayoutShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { selectedStoreId } = useVendorActiveStore()

  useVendorRealtimeOrders({
    storeId: selectedStoreId || '',
    enableSound: true,
    enableDesktopNotification: true,
  })

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.topRight}>
          <span className={styles.vendorBadge}>Vendor Portal</span>
          <VendorStoreSwitcher />
          <OrderCountWidget />
        </div>
      </header>

      <div className={styles.main}>
        <VendorSideNav />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function VendorLayout() {
  const { data: stores = [] } = useVendorStores()

  return (
    <VendorActiveStoreProvider stores={stores}>
      <VendorLayoutShell />
    </VendorActiveStoreProvider>
  )
}
