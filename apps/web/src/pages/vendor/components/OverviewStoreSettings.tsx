/**
 * OverviewStoreSettings — the store's settings, edited in place on its Overview.
 */
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { StoreSettings } from './store-form/StoreSettings'
import { useStoreForm } from '../hooks/useStoreForm'

export function OverviewStoreSettings({ storeId }: { readonly storeId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    store,
    isLoadingStore,
    formData,
    pendingScopedMediaFiles,
    setPendingScopedMediaFiles,
    isSubmitting,
    isDirty,
    discardChanges,
    handleChange,
    handleSubmit,
  } = useStoreForm(storeId)

  return (
    <StoreSettings
      storeId={storeId}
      storeName={store?.name ?? formData.name}
      loading={isLoadingStore}
      formData={formData}
      onChange={handleChange}
      isSubmitting={isSubmitting}
      isDirty={isDirty}
      onSubmit={handleSubmit}
      onDiscard={discardChanges}
      pendingFiles={pendingScopedMediaFiles}
      onPendingFiles={setPendingScopedMediaFiles}
      onDeleted={() => {
        queryClient.setQueriesData<VendorStore[]>({ queryKey: ['vendor-managed-stores'] }, (stores) =>
          stores?.filter((s) => s.id !== storeId),
        )
        void queryClient.invalidateQueries({ queryKey: ['vendor-managed-stores'] })
        void queryClient.invalidateQueries({ queryKey: ['vendor-stores'] })
        queryClient.removeQueries({ queryKey: ['store', storeId] })
        toast.success('Store deleted')
        navigate('/vendor', { replace: true })
      }}
    />
  )
}
