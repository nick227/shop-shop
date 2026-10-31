import { Button, Spinner } from '@shared/ui/primitives'
import { StoreContactSection } from './StoreContactSection'
import { StoreIdentitySection } from './StoreIdentitySection'
import { StoreLocationSection } from './StoreLocationSection'
import { StoreOrdersSection } from './StoreOrdersSection'
import { StorePhotosSection } from './StorePhotosSection'
import { needsNameAndAddress, type StoreFieldProps } from './storeFieldProps'

const NAV = [
  ['store', 'Store'],
  ['location', 'Location'],
  ['orders', 'Orders'],
  ['photos', 'Photos'],
  ['contact', 'Contact'],
] as const

interface StoreFormDocumentProps extends StoreFieldProps {
  readonly isEdit: boolean
  readonly storeId?: string
  readonly onSubmit: (e: React.FormEvent) => void
  readonly isSubmitting: boolean
  readonly pendingFiles: readonly File[]
  readonly onPendingFiles: (files: File[]) => void
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function StoreFormDocument({
  isEdit,
  storeId,
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  pendingFiles,
  onPendingFiles,
}: StoreFormDocumentProps) {
  const showHint = !isEdit && needsNameAndAddress(formData)

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-16">
      <nav className="flex gap-5 overflow-x-auto lg:sticky lg:top-4 lg:flex-col lg:gap-3 lg:self-start" aria-label="Store sections">
        {NAV.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="shrink-0 text-left text-sm text-muted-foreground hover:text-foreground"
            onClick={() => scrollToSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-16 pb-8">
        <StoreIdentitySection formData={formData} onChange={onChange} />
        <div className="grid items-start gap-16 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <StoreLocationSection formData={formData} onChange={onChange} />
          <StoreOrdersSection formData={formData} onChange={onChange} />
        </div>
        <StorePhotosSection
          formData={formData}
          onChange={onChange}
          isEdit={isEdit}
          storeId={storeId}
          pendingFiles={pendingFiles}
          onPendingFiles={onPendingFiles}
        />
        <StoreContactSection formData={formData} onChange={onChange} />
      </div>

      <div className="sticky bottom-0 z-10 col-span-full -mx-4 border-t border-border bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex items-center justify-end gap-4">
          {showHint && (
            <p className="mr-auto text-sm text-muted-foreground">Add a name and address to save.</p>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="small" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
