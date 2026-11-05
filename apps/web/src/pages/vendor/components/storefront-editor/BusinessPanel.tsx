/**
 * Business information and menu organization. These are live details of the store, not part of the
 * storefront draft, so changes here reach shoppers right away; the panel says so and links to them.
 */
import { Link } from 'react-router-dom'
import { Check, Circle } from 'lucide-react'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import type { StorefrontHours } from '@features/storefront/api'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { PanelSection } from './controls'

export function BusinessPanel({ storeId, store, hours }: {
  readonly storeId: string
  readonly store: StoreHeaderStore
  readonly hours: StorefrontHours | null
}) {
  const social = Object.values(store.socialLinksJson ?? {}).filter((value) => typeof value === 'string' && value).length
  const checklist = [
    { done: Boolean(store.description), label: 'Description', tab: 'store' },
    { done: Boolean(hours?.week), label: 'Hours', tab: 'location' },
    { done: Boolean(store.addressStreet || store.addressCity), label: 'Address', tab: 'location' },
    { done: Boolean(store.phone || store.email), label: 'Phone or email', tab: 'contact' },
    { done: social > 0, label: social > 0 ? `Social links (${social})` : 'Social links', tab: 'contact' },
  ]

  return (
    <div className="space-y-5">
      <PanelSection title="Shown on your storefront" description="Edited in store settings; saved changes go live right away.">
        <ul className="space-y-1.5">
          {checklist.map((entry) => (
            <li key={entry.label} className="flex items-center gap-2 text-sm">
              {entry.done ? (
                <Check className="h-4 w-4 text-emerald-600" aria-label="Set" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" aria-label="Missing" />
              )}
              <span className="flex-1">{entry.label}</span>
              <Link to={vendorPaths.settings(storeId, entry.tab)} className="text-xs font-medium text-primary hover:underline">
                {entry.done ? 'Edit' : 'Add'}
              </Link>
            </li>
          ))}
        </ul>
      </PanelSection>

    </div>
  )
}
