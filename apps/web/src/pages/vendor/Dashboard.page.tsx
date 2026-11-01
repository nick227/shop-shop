import { useAccountCapabilities } from '@features/account/useAccountCapabilities'
/**
 * All stores — the directory for operators with several stores. Reached from the store switcher.
 */
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { VendorPage } from '@layouts/VendorLayout/page'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { StoreDirectory } from './components/StoreDirectory'

export default function VendorDashboardPage() {
  const { capabilities } = useAccountCapabilities()
  const navigate = useNavigate()
  const { stores, selectedStoreId } = useVendorActiveStore()

  return (
    <VendorPage
      title="All stores"
      width="narrow"
      actions={capabilities?.canCreateStore ?
        <Button variant="primary" onClick={() => navigate(vendorPaths.newStore)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add a store
        </Button> : undefined
      }
    >
      <StoreDirectory
        stores={stores}
        currentStoreId={selectedStoreId}
        onOpen={(storeId) => navigate(vendorPaths.overview(storeId))}
        onSettings={(storeId) => navigate(vendorPaths.settings(storeId))}
      />
    </VendorPage>
  )
}
