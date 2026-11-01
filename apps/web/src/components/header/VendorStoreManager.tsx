import { Link } from 'react-router-dom'
import { useAccountCapabilities } from '@features/account/useAccountCapabilities'
/** Compatibility entry for older headers. No store discovery requests. */
export function VendorStoreManager({ className = '' }: { readonly className?: string; readonly onNavigateToVendor?: () => void }) {
  const { capabilities } = useAccountCapabilities()
  return capabilities?.canAccessVendorPortal ? <Link to="/vendor" className={className}>Vendor Portal</Link> : null
}
