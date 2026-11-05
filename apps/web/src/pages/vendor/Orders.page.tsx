import { VendorPage } from '@layouts/VendorLayout/page'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { OrderWorkspace } from '@features/orders/components/OrderWorkspace'

export default function VendorOrdersPage() {
  const { selectedStoreId } = useVendorActiveStore()
  return (
    <VendorPage title="Order center" description="Make a promise. Keep every order moving.">
      {selectedStoreId ? (
        <OrderWorkspace key={selectedStoreId} storeId={selectedStoreId} />
      ) : (
        <p className="py-8 text-muted-foreground">Choose a store to manage its orders.</p>
      )}
    </VendorPage>
  )
}
