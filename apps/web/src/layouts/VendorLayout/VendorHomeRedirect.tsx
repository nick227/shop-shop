import { Navigate } from 'react-router-dom'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useVendorActiveStore } from './VendorActiveStoreContext'

/** `/vendor` opens the store you last worked in, never a picker. */
export function VendorHomeRedirect() {
  const { selectedStoreId } = useVendorActiveStore()
  if (!selectedStoreId) return <Navigate to={vendorPaths.newStore} replace />
  return <Navigate to={vendorPaths.overview(selectedStoreId)} replace />
}
