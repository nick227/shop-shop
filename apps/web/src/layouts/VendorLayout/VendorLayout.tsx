/**
 * VendorLayout - Unified layout for all vendor pages
 * 
 * Features:
 * - Persistent navigation (side nav)
 * - Centralized OrderCountWidget
 * - Store context awareness
 * - Professional appearance
 * - Mobile responsive
 */

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Button } from '@shared/ui/primitives'
import { OrderCountWidget } from '@features/orders/components/OrderCountWidget'
import { useVendorStores, useVendorRealtimeOrders } from '@shared/hooks/hooks/vendor'
import type { StoreResponse } from '@api/backend-types'
import styles from './VendorLayout.module.css'

export function VendorLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { data: stores } = useVendorStores()

  // Enable real-time for first store (if any stores exist)
  const firstStore = (stores?.[0] as unknown as StoreResponse) ?? undefined
  const hasStores = stores && stores.length > 0
  
  useVendorRealtimeOrders({
    storeId: firstStore?.id ?? '',
    enableSound: true,
    enableDesktopNotification: true,
  })

  const isActive = (path: string) => location.pathname.startsWith(path)
  
  // Constants for repeated strings
  const STORE_BASE_PATH = '/vendor/stores/'
  const STORE_EDIT_PATH = '/edit'
  const STORE_ITEMS_PATH = '/items'
  const STORE_RIVER_PATH = '/river'
  const STORE_ITEMS_NEW_PATH = '/items/new'
  
  // Helper functions to avoid nested template literals
  const getStoreEditPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}${STORE_EDIT_PATH}`
  const getStoreItemsPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}${STORE_ITEMS_PATH}`
  const getStoreRiverPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}${STORE_RIVER_PATH}`

  return (
    <div className={styles.layout}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button onClick={() => navigate('/')} className={styles.logo}>
            🏪 Shop-Shop
          </button>
          <span className={styles.vendorBadge}>Vendor Portal</span>
        </div>
        
        <div className={styles.topRight}>
          <OrderCountWidget />
          <span className={styles.userName}>{user?.name}</span>
          <Button variant="ghost" size="small" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div className={styles.main}>
        {/* Side Navigation */}
        <nav className={styles.sideNav}>
          <div className={styles.navSection}>
            <div className={styles.navLabel}>Overview</div>
            <button
              className={`${styles.navItem} ${isActive('/vendor/dashboard') ? styles.navItemActive : ''}`}
              onClick={() => navigate('/vendor/dashboard')}
            >
              <span className={styles.navIcon}>🏪</span>
              <span>My Stores</span>
            </button>
            <button
              className={`${styles.navItem} ${isActive('/vendor/orders') ? styles.navItemActive : ''}`}
              onClick={() => navigate('/vendor/orders')}
            >
              <span className={styles.navIcon}>📋</span>
              <span>Orders</span>
            </button>
            <button
              className={`${styles.navItem} ${isActive('/vendor/team') || location.pathname.endsWith('/team') ? styles.navItemActive : ''}`}
              onClick={() => navigate(firstStore ? `${STORE_BASE_PATH}${firstStore.id}/team` : '/vendor/team')}
            >
              <span className={styles.navIcon}>T</span>
              <span>Team & Drivers</span>
            </button>
          </div>

          {hasStores && firstStore && (
            <div className={styles.navSection}>
              <div className={styles.navLabel}>
                Current Store: {firstStore.name}
              </div>
              <button
                className={`${styles.navItem} ${isActive(getStoreEditPath(firstStore.id)) ? styles.navItemActive : ''}`}
                onClick={() => navigate(getStoreEditPath(firstStore.id))}
              >
                <span className={styles.navIcon}>✏️</span>
                <span>Store Details</span>
              </button>
              <button
                className={`${styles.navItem} ${isActive(getStoreItemsPath(firstStore.id)) ? styles.navItemActive : ''}`}
                onClick={() => navigate(getStoreItemsPath(firstStore.id))}
              >
                <span className={styles.navIcon}>🍽️</span>
                <span>Menu Items</span>
              </button>
              <button
                className={`${styles.navItem} ${isActive(getStoreRiverPath(firstStore.id)) ? styles.navItemActive : ''}`}
                onClick={() => navigate(getStoreRiverPath(firstStore.id))}
              >
                <span className={styles.navIcon}>📱</span>
                <span>Store River</span>
              </button>
            </div>
          )}

          {!hasStores && (
            <div className={styles.navSection}>
              <div className={styles.navLabel}>
                Getting Started
              </div>
              <div className={styles.emptyState}>
                <p>👋 Welcome to the Vendor Portal!</p>
                <p>Create your first store to get started.</p>
              </div>
            </div>
          )}

          <div className={styles.navSection}>
            <div className={styles.navLabel}>Quick Actions</div>
            <button
              className={styles.navItem}
              onClick={() => navigate('/vendor/store/new')}
            >
              <span className={styles.navIcon}>➕</span>
              <span>Create Store</span>
            </button>
            {hasStores && firstStore && (
              <button
                className={styles.navItem}
                onClick={() => navigate(`${STORE_BASE_PATH}${firstStore.id}${STORE_ITEMS_NEW_PATH}`)}
              >
                <span className={styles.navIcon}>🍕</span>
                <span>Add Menu Item</span>
              </button>
            )}
          </div>

          <div className={styles.navSection}>
            <button
              className={styles.navItem}
              onClick={() => navigate('/')}
            >
              <span className={styles.navIcon}>🏠</span>
              <span>Customer View</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
