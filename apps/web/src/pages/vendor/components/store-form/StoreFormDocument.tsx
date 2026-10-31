import { useState } from 'react'
import { Button, Spinner } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { StoreContactSection } from './StoreContactSection'
import { StoreIdentitySection } from './StoreIdentitySection'
import { StoreLocationSection } from './StoreLocationSection'
import { StoreOrdersSection } from './StoreOrdersSection'
import { StorePhotosSection } from './StorePhotosSection'
import { hasText, type StoreFieldProps } from './storeFieldProps'
import { StoreSectionTitle } from './StoreSectionTitle'
import { STORE_TABS, type StoreTab } from './storeTabs'

interface StoreFormDocumentProps extends StoreFieldProps {
  readonly isEdit: boolean
  readonly storeId?: string
  readonly onSubmit: (e?: React.FormEvent) => void
  readonly isSubmitting: boolean
  readonly pendingFiles: readonly File[]
  readonly onPendingFiles: (files: File[]) => void
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
  const [tab, setTab] = useState<StoreTab>('store')
  const tabLabel = STORE_TABS.find(([id]) => id === tab)?.[1] ?? ''
  const showHint = !hasText(formData.name)

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <input
        aria-label="Store name"
        required
        value={formData.name}
        onChange={(e) => onChange('name', e.target.value)}
        onBlur={() => {
          if (!isEdit && hasText(formData.name)) onSubmit()
        }}
        placeholder="Store name"
        className="w-full border-0 bg-transparent p-0 text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-0 md:text-5xl"
      />

      <div role="tablist" aria-label="Store sections" className="flex gap-6 overflow-x-auto border-b border-border">
        {STORE_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              '-mb-px shrink-0 border-b-2 pb-3 text-sm',
              tab === id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tabLabel} className="min-h-[24rem] space-y-8 pb-8">
        <StoreSectionTitle>{tabLabel}</StoreSectionTitle>
        {tab === 'store' && (
          <div className="space-y-10">
            <StoreIdentitySection formData={formData} onChange={onChange} storeId={storeId} />
            <StorePhotosSection
              formData={formData}
              onChange={onChange}
              storeId={storeId}
              pendingFiles={pendingFiles}
              onPendingFiles={onPendingFiles}
            />
          </div>
        )}
        {tab === 'location' && <StoreLocationSection formData={formData} onChange={onChange} />}
        {tab === 'orders' && <StoreOrdersSection formData={formData} onChange={onChange} />}
        {tab === 'contact' && <StoreContactSection formData={formData} onChange={onChange} />}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex items-center justify-end gap-4">
          {showHint && (
            <p className="mr-auto text-sm text-muted-foreground">Add a store name to save.</p>
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
