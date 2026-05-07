import { useNavigate, useLocation } from 'react-router-dom'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import styles from './VendorLayout.module.css'

export function VendorSideNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedStoreId, stores } = useVendorActiveStore()

  const hasStores = stores.length > 0
  const isActive = (path: string) => location.pathname.startsWith(path)

  const STORE_BASE_PATH = '/vendor/stores/'
  const STORE_ITEMS_NEW_PATH = '/items/new'

  const getStoreEditPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}/edit`
  const getStoreItemsPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}/items`
  const getStoreRiverPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}/river`

  const storeSegment =
    hasStores && selectedStoreId
      ? {
          affiliates: `/vendor/affiliates?storeId=${selectedStoreId}`,
          team: `/vendor/team?storeId=${selectedStoreId}`,
          drivers: `/vendor/drivers?storeId=${selectedStoreId}`,
        }
      : {
          affiliates: '/vendor/affiliates',
          team: '/vendor/team',
          drivers: '/vendor/drivers',
        }

  return (
    <nav className={styles.sideNav}>
      <div className={styles.navSection}>
        <div className={styles.navLabel}>Overview</div>
        <button
          type="button"
          className={`${styles.navItem} ${isActive('/vendor/dashboard') ? styles.navItemActive : ''}`}
          onClick={() => navigate('/vendor/dashboard')}
        >
          <span className={styles.navIcon}>🏪</span>
          <span>My Stores</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isActive('/vendor/orders') ? styles.navItemActive : ''}`}
          onClick={() => navigate('/vendor/orders')}
        >
          <span className={styles.navIcon}>📋</span>
          <span>Orders</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${location.pathname === '/vendor/affiliates' ? styles.navItemActive : ''}`}
          onClick={() => navigate(storeSegment.affiliates)}
        >
          <span className={styles.navIcon}>A</span>
          <span>Affiliates</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${location.pathname === '/vendor/team' ? styles.navItemActive : ''}`}
          onClick={() => navigate(storeSegment.team)}
        >
          <span className={styles.navIcon}>T</span>
          <span>Team</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${location.pathname === '/vendor/drivers' ? styles.navItemActive : ''}`}
          onClick={() => navigate(storeSegment.drivers)}
        >
          <span className={styles.navIcon}>D</span>
          <span>Drivers</span>
        </button>
      </div>

      {hasStores && selectedStoreId && (
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Active store</div>
          <button
            type="button"
            className={`${styles.navItem} ${isActive(getStoreEditPath(selectedStoreId)) ? styles.navItemActive : ''}`}
            onClick={() => navigate(getStoreEditPath(selectedStoreId))}
          >
            <span className={styles.navIcon}>✏️</span>
            <span>Store Details</span>
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${isActive(getStoreItemsPath(selectedStoreId)) ? styles.navItemActive : ''}`}
            onClick={() => navigate(getStoreItemsPath(selectedStoreId))}
          >
            <span className={styles.navIcon}>🍽️</span>
            <span>Menu Items</span>
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${isActive(getStoreRiverPath(selectedStoreId)) ? styles.navItemActive : ''}`}
            onClick={() => navigate(getStoreRiverPath(selectedStoreId))}
          >
            <span className={styles.navIcon}>📱</span>
            <span>Store River</span>
          </button>
        </div>
      )}

      <div className={styles.navSection}>
        <button type="button" className={styles.navItem} onClick={() => navigate('/vendor/store/new')}>
          <span className={styles.navIcon}>➕</span>
          <span>Create Store</span>
        </button>
        {hasStores && selectedStoreId && (
          <button
            type="button"
            className={styles.navItem}
            onClick={() => navigate(`${STORE_BASE_PATH}${selectedStoreId}${STORE_ITEMS_NEW_PATH}`)}
          >
            <span className={styles.navIcon}>🍕</span>
            <span>Add Menu Item</span>
          </button>
        )}
      </div>

      <div className={styles.navSection}>
        <button type="button" className={styles.navItem} onClick={() => navigate('/')}>
          <span className={styles.navIcon}>🏠</span>
          <span>Customer View</span>
        </button>
      </div>
    </nav>
  )
}
