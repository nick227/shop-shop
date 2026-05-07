import { useNavigate, useLocation } from 'react-router-dom'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import styles from './VendorLayout.module.css'

export function VendorSideNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedStoreId, selectedStore } = useVendorActiveStore()

  const storeScoped = Boolean(selectedStoreId)
  const isActive = (path: string) => location.pathname.startsWith(path)

  const STORE_BASE_PATH = '/vendor/stores/'

  const getStoreEditPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}/edit`
  const getStoreItemsPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}/items`
  const getStoreRiverPath = (storeId: string) => `${STORE_BASE_PATH}${storeId}/river`

  const activeStoreTitle =
    selectedStoreId && selectedStore?.name?.trim() ? selectedStore.name.trim() : 'Store'

  const peoplePaths = selectedStoreId
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

  const navigateScoped = (to: string) => {
    if (!selectedStoreId) return
    navigate(to)
  }

  const navClass = (active: boolean) => `${styles.navItem} ${active ? styles.navItemActive : ''}`

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
          <span className={styles.navItemText}>My Stores</span>
        </button>

        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(
            Boolean(selectedStoreId && isActive(getStoreEditPath(selectedStoreId))),
          )}
          onClick={() => {
            if (!selectedStoreId) return
            navigate(getStoreEditPath(selectedStoreId))
          }}
        >
          <span className={styles.navIcon}>✏️</span>
          <span className={styles.navItemText} title={activeStoreTitle}>
            {activeStoreTitle}
          </span>
        </button>

        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(isActive('/vendor/orders'))}
          onClick={() => navigateScoped('/vendor/orders')}
        >
          <span className={styles.navIcon}>📋</span>
          <span className={styles.navItemText}>Orders</span>
        </button>
        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(location.pathname === '/vendor/affiliates')}
          onClick={() => navigateScoped(peoplePaths.affiliates)}
        >
          <span className={styles.navIcon}>A</span>
          <span className={styles.navItemText}>Affiliates</span>
        </button>
        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(location.pathname === '/vendor/team')}
          onClick={() => navigateScoped(peoplePaths.team)}
        >
          <span className={styles.navIcon}>T</span>
          <span className={styles.navItemText}>Team</span>
        </button>
        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(location.pathname === '/vendor/drivers')}
          onClick={() => navigateScoped(peoplePaths.drivers)}
        >
          <span className={styles.navIcon}>D</span>
          <span className={styles.navItemText}>Drivers</span>
        </button>
        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(
            Boolean(selectedStoreId && isActive(getStoreItemsPath(selectedStoreId))),
          )}
          onClick={() => {
            if (!selectedStoreId) return
            navigate(getStoreItemsPath(selectedStoreId))
          }}
        >
          <span className={styles.navIcon}>🍽️</span>
          <span className={styles.navItemText}>Menu Items</span>
        </button>
        <button
          type="button"
          disabled={!storeScoped}
          className={navClass(
            Boolean(selectedStoreId && isActive(getStoreRiverPath(selectedStoreId))),
          )}
          onClick={() => {
            if (!selectedStoreId) return
            navigate(getStoreRiverPath(selectedStoreId))
          }}
        >
          <span className={styles.navIcon}>📱</span>
          <span className={styles.navItemText}>Store River</span>
        </button>
      </div>
    </nav>
  )
}
