/**
 * StoreFormPage - Settings for an existing store; a focused name-first page for a new one.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { StoreFormDocument } from './components/store-form/StoreFormDocument'
import { StoreSettings } from './components/store-form/StoreSettings'
import { useStoreForm } from './hooks/useStoreForm'

export default function StoreFormPage() {
  const { storeId } = useParams<{ storeId?: string }>()
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

  if (storeId) {
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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <StoreFormDocument
        isEdit={false}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        pendingFiles={pendingScopedMediaFiles}
        onPendingFiles={setPendingScopedMediaFiles}
      />
    </div>
  )
}
