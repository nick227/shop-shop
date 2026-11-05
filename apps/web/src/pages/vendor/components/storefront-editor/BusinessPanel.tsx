/**
 * Business information and menu organization. These are live details of the store, not part of the
 * storefront draft, so changes here reach shoppers right away; the panel says so and links to them.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Circle, FolderCog } from 'lucide-react'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import type { StorefrontHours } from '@features/storefront/api'
import { Button } from '@shared/ui/primitives'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import type { MenuSection } from '@shared/lib/menu/menuSections'
import { ManageSectionsDialog } from '../ManageSectionsDialog'
import { PanelSection } from './controls'

export function BusinessPanel({ storeId, store, hours, sections }: {
  readonly storeId: string
  readonly store: StoreHeaderStore
  readonly hours: StorefrontHours | null
  readonly sections: readonly MenuSection[]
}) {
  const [managing, setManaging] = useState(false)
  const social = Object.values(store.socialLinksJson ?? {}).filter((value) => typeof value === 'string' && value).length
  const checklist = [
    { done: Boolean(store.description), label: 'Description', tab: 'store' },
    { done: Boolean(hours?.week), label: 'Hours', tab: 'location' },
    { done: Boolean(store.addressStreet || store.addressCity), label: 'Address', tab: 'location' },
    { done: Boolean(store.phone || store.email), label: 'Phone or email', tab: 'contact' },
    { done: social > 0, label: social > 0 ? `Social links (${social})` : 'Social links', tab: 'contact' },
  ]
  const visibleSections = sections.filter((section) => section.isVisible).length

  return (
    <div className="space-y-5">
      <PanelSection title="Business information" description="Edited in store settings. These go live as soon as you save them there.">
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
        <p className="text-xs text-muted-foreground">
          Announcements, photos and the gallery come from this editor and your media library; updates come from your River posts.
        </p>
      </PanelSection>

      <PanelSection
        title="Menu organization"
        description={`${visibleSections} of ${sections.length} ${sections.length === 1 ? 'section' : 'sections'} shown. Section changes go live right away.`}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="small" onClick={() => setManaging(true)}>
            <FolderCog className="h-4 w-4" />
            Edit sections
          </Button>
          <Link
            to={vendorPaths.menu(storeId)}
            className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Open menu
          </Link>
        </div>
      </PanelSection>
      <ManageSectionsDialog open={managing} onOpenChange={setManaging} storeId={storeId} sections={sections} />
    </div>
  )
}
