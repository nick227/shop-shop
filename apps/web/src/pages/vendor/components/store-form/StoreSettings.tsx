/**
 * StoreSettings — an existing store's settings, shown as a section of its Overview.
 * Payments and Delete store live here instead of the store directory.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Input, Tabs } from '@shared/ui/primitives'
import { useSearchParamState } from '@shared/hooks/useSearchParamState'
import { SaveBar, UnsavedChangesGuard } from '@layouts/VendorLayout/page'
import { STORE_SETTINGS_ANCHOR } from '@shared/lib/utils/navigation/vendorPaths'
import { DeleteStoreSection } from '../DeleteStoreSection'
import { VendorStripeConnectSection } from '../VendorStripeConnectSection'
import { StoreContactSection } from './StoreContactSection'
import { StoreIdentitySection } from './StoreIdentitySection'
import { StoreLocationSection } from './StoreLocationSection'
import { StoreOrdersSection } from './StoreOrdersSection'
import { StorePhotosSection } from './StorePhotosSection'
import { StoreSectionTitle } from './StoreSectionTitle'
import { STORE_TABS } from './storeTabs'
import type { StoreFieldProps } from './storeFieldProps'

const SETTINGS_TABS = [
  ...STORE_TABS.map(([id, label]) => ({ id, label })),
  { id: 'payments', label: 'Payments' },
] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]['id']
const TAB_IDS: readonly SettingsTab[] = SETTINGS_TABS.map((tab) => tab.id)

interface StoreSettingsProps extends StoreFieldProps {
  readonly storeId: string
  readonly storeName: string
  readonly loading: boolean
  readonly isSubmitting: boolean
  readonly isDirty: boolean
  readonly onSubmit: (e?: React.FormEvent) => void
  readonly onDiscard: () => void
  readonly pendingFiles: readonly File[]
  readonly onPendingFiles: (files: File[]) => void
  readonly onDeleted: () => void
}

export function StoreSettings({
  storeId,
  storeName,
  loading,
  formData,
  onChange,
  isSubmitting,
  isDirty,
  onSubmit,
  onDiscard,
  pendingFiles,
  onPendingFiles,
  onDeleted,
}: StoreSettingsProps) {
  const [tab, setTab] = useSearchParamState<SettingsTab>('tab', 'store', TAB_IDS)
  const tabLabel = SETTINGS_TABS.find((item) => item.id === tab)?.label ?? ''
  const { hash } = useLocation()
  const sectionRef = useRef<HTMLElement>(null)

  // Links such as the setup steps point here; bring the section into view when they're followed.
  useEffect(() => {
    if (hash === `#${STORE_SETTINGS_ANCHOR}`)
      sectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [hash, tab])

  return (
    <section
      ref={sectionRef}
      id={STORE_SETTINGS_ANCHOR}
      aria-labelledby="store-settings-heading"
      className="scroll-mt-6 space-y-6"
    >
      <h2 id="store-settings-heading" className="text-lg font-semibold tracking-tight">
        Store settings
      </h2>
      <Tabs label="Settings sections" items={SETTINGS_TABS} value={tab} onChange={setTab} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : (
        <div role="tabpanel" aria-label={tabLabel} className="space-y-8">
          <StoreSectionTitle>{tabLabel}</StoreSectionTitle>

          <form onSubmit={onSubmit} className="space-y-10">
            {tab === 'store' && (
              <>
                <Input
                  label="Store name"
                  required
                  value={formData.name}
                  onChange={(e) => onChange('name', e.target.value)}
                />
                <StoreIdentitySection formData={formData} onChange={onChange} storeId={storeId} />
                <StorePhotosSection
                  formData={formData}
                  onChange={onChange}
                  storeId={storeId}
                  pendingFiles={pendingFiles}
                  onPendingFiles={onPendingFiles}
                />
              </>
            )}
            {tab === 'location' && <StoreLocationSection formData={formData} onChange={onChange} />}
            {tab === 'orders' && <StoreOrdersSection formData={formData} onChange={onChange} storeId={storeId} />}
            {tab === 'contact' && <StoreContactSection formData={formData} onChange={onChange} />}
            {tab === 'payments' && <VendorStripeConnectSection storeId={storeId} />}
            <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={onDiscard} />
          </form>

          {tab === 'store' && (
            <DeleteStoreSection storeId={storeId} storeName={storeName} onDeleted={onDeleted} />
          )}
        </div>
      )}
      <UnsavedChangesGuard dirty={isDirty} />
    </section>
  )
}
