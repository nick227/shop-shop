import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DeleteStoreSection } from './DeleteStoreSection'
import { VendorStripeConnectSection } from './VendorStripeConnectSection'

interface ActiveStoreOperationsProps {
  readonly storeId: string
  readonly storeName: string
}

export function ActiveStoreOperations({ storeId, storeName }: ActiveStoreOperationsProps) {
  const queryClient = useQueryClient()

  return (
    <div className="space-y-6 border-t border-border py-5">
      <VendorStripeConnectSection storeId={storeId} />
      <DeleteStoreSection
        storeId={storeId}
        storeName={storeName}
        onDeleted={() => {
          void queryClient.invalidateQueries({ queryKey: ['vendor-managed-stores'] })
          void queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
          queryClient.removeQueries({ queryKey: ['store', storeId] })
          toast.success('Store deleted')
        }}
      />
    </div>
  )
}
