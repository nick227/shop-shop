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
        <div className={styles.topLeft}>
          <button type="button" onClick={() => navigate('/')} className={styles.logo}>
            🏪 Shop-Shop
          </button>
          <span className={styles.vendorBadge}>Vendor Portal</span>
        </div>

        <div className={styles.topRight}>
          <Button variant="outline" size="small" type="button" onClick={() => navigate('/vendor/store/new')}>
            Create Store
          </Button>
          <VendorStoreSwitcher />
          <OrderCountWidget />
          <span className={styles.userName}>{user?.name}</span>
          <Button variant="ghost" size="small" onClick={() => void logout()}>
            Logout
          </Button>
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
