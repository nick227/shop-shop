/**
 * StoreFormPage - The focused, name-first page for a new store. An existing store's settings live on its Overview.
 */
import { StoreFormDocument } from './components/store-form/StoreFormDocument'
import { useStoreForm } from './hooks/useStoreForm'

export default function StoreFormPage() {
  const {
    isEdit,
    storeId,
    formData,
    pendingScopedMediaFiles,
    setPendingScopedMediaFiles,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useStoreForm()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <StoreFormDocument
        isEdit={isEdit}
        storeId={storeId}
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
