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
import { useAuth } from '@hooks/useAuth'
import { Button } from '@ui'
import { OrderCountWidget } from '../../features/orders/components/OrderCountWidget'
import { useVendorStores, useVendorRealtimeOrders } from '@hooks/vendor'
import styles from './VendorLayout.module.css'

export function VendorLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { data: stores } = useVendorStores()

  // Enable real-time for first store (if any stores exist)
  const firstStore = stores?.[0]
  const hasStores = stores && stores.length > 0
  
  useVendorRealtimeOrders({
    storeId: firstStore?.id || '',
    enableSound: true,
    enableDesktopNotification: true,
  })

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className={styles['layout']}>
      {/* Top Bar */}
      <header className={styles['topBar']}>
        <div className={styles['topLeft']}>
          <button onClick={() => navigate('/')} className={styles['logo']}>
            🏪 Shop-Shop
          </button>
          <span className={styles['vendorBadge']}>Vendor Portal</span>
        </div>
        
        <div className={styles['topRight']}>
          <OrderCountWidget />
          <span className={styles['userName']}>{user?.name}</span>
          <Button variant="ghost" size="small" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div className={styles['main']}>
        {/* Side Navigation */}
        <nav className={styles['sideNav']}>
          <div className={styles['navSection']}>
            <div className={styles['navLabel']}>Overview</div>
            <button
              className={`${styles['navItem']} ${isActive('/vendor/dashboard') ? styles['navItemActive'] : ''}`}
              onClick={() => navigate('/vendor/dashboard')}
            >
              <span className={styles['navIcon']}>🏪</span>
              <span>My Stores</span>
            </button>
            <button
              className={`${styles['navItem']} ${isActive('/vendor/orders') ? styles['navItemActive'] : ''}`}
              onClick={() => navigate('/vendor/orders')}
            >
              <span className={styles['navIcon']}>📋</span>
              <span>Orders</span>
            </button>
          </div>

          {hasStores && firstStore && (
            <div className={styles['navSection']}>
              <div className={styles['navLabel']}>
                Current Store: {firstStore.name}
              </div>
              <button
                className={`${styles['navItem']} ${isActive(`/vendor/stores/${firstStore.id}/edit`) ? styles['navItemActive'] : ''}`}
                onClick={() => navigate('/vendor/stores/' + firstStore.id + '/edit')}
              >
                <span className={styles['navIcon']}>✏️</span>
                <span>Store Details</span>
              </button>
              <button
                className={`${styles['navItem']} ${isActive(`/vendor/stores/${firstStore.id}/items`) ? styles['navItemActive'] : ''}`}
                onClick={() => navigate('/vendor/stores/' + firstStore.id + '/items')}
              >
                <span className={styles['navIcon']}>🍽️</span>
                <span>Menu Items</span>
              </button>
              <button
                className={`${styles['navItem']} ${isActive(`/vendor/stores/${firstStore.id}/river`) ? styles['navItemActive'] : ''}`}
                onClick={() => navigate('/vendor/stores/' + firstStore.id + '/river')}
              >
                <span className={styles['navIcon']}>📱</span>
                <span>Store River</span>
              </button>
            </div>
          )}

          {!hasStores && (
            <div className={styles['navSection']}>
              <div className={styles['navLabel']}>
                Getting Started
              </div>
              <div className={styles['emptyState']}>
                <p>👋 Welcome to the Vendor Portal!</p>
                <p>Create your first store to get started.</p>
              </div>
            </div>
          )}

          <div className={styles['navSection']}>
            <div className={styles['navLabel']}>Quick Actions</div>
            <button
              className={styles['navItem']}
              onClick={() => navigate('/vendor/stores/new')}
            >
              <span className={styles['navIcon']}>➕</span>
              <span>Create Store</span>
            </button>
            {hasStores && firstStore && (
              <button
                className={styles['navItem']}
                onClick={() => navigate('/vendor/stores/' + firstStore.id + '/items/new')}
              >
                <span className={styles['navIcon']}>🍕</span>
                <span>Add Menu Item</span>
              </button>
            )}
          </div>

          <div className={styles['navSection']}>
            <button
              className={styles['navItem']}
              onClick={() => navigate('/')}
            >
              <span className={styles['navIcon']}>🏠</span>
              <span>Customer View</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className={styles['content']}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

