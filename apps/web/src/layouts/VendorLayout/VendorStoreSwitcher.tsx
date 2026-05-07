import { useVendorActiveStore } from './VendorActiveStoreContext'
import styles from './VendorLayout.module.css'

/**
 * Global vendor active store — must render under VendorActiveStoreProvider.
 */
export function VendorStoreSwitcher() {
  const { stores, selectedStoreId, setSelectedStoreId } = useVendorActiveStore()

  if (stores.length === 0) {
    return
  }

  return (
    <div className={styles.storeSwitcher}>
      <label className={styles.storeSwitcherLabel} htmlFor="vendor-active-store">
        Store
      </label>
      <select
        id="vendor-active-store"
        className={styles.storeSwitcherSelect}
        value={selectedStoreId}
        onChange={(event) => setSelectedStoreId(event.target.value)}
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name ?? store.id}
          </option>
        ))}
      </select>
    </div>
  )
}
