/**
 * StoreFormPage - Create or edit a store as one wide document.
 */
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Spinner } from '@shared/ui/primitives'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { StoreFormDocument } from './components/store-form/StoreFormDocument'
import { useStoreForm } from './hooks/useStoreForm'

export default function StoreFormPage() {
  const { storeId } = useParams<{ storeId?: string }>()
  const {
    isEdit,
    store,
    isLoadingStore,
    formData,
    pendingScopedMediaFiles,
    setPendingScopedMediaFiles,
    isSubmitting,
    handleChange,
    handleSubmit,
    onBack,
  } = useStoreForm(storeId)

  if (isLoadingStore) {
    return (
      <PageShell nested contentClassName="py-8 md:py-10">
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell nested contentClassName="space-y-10 py-8 md:py-10">
      <PageHeader
        title={isEdit ? store?.name || 'Store' : 'New store'}
        backButton={
          <Button
            variant="ghost"
            size="small"
            onClick={onBack}
            className="-ml-2 text-muted-foreground hover:bg-transparent"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Stores
          </Button>
        }
        actions={
          isEdit && storeId ? (
            <a
              href={getStoreRoute({ id: storeId, name: formData.name })}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View store
            </a>
          ) : undefined
        }
      />

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
    </PageShell>
  )
}
