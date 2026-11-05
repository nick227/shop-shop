/**
 * Menu: how products are laid out, and the menu's own sections (which go live right away).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderCog } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import type { MenuSection } from '@shared/lib/menu/menuSections'
import { ManageSectionsDialog } from '../ManageSectionsDialog'
import { Choice, PanelSection } from './controls'
import type { PanelProps } from './types'

export function MenuPanel({ storeId, draft, update, sections }: PanelProps & { readonly sections: readonly MenuSection[] }) {
  const [managing, setManaging] = useState(false)
  const shown = sections.filter((section) => section.isVisible).length

  return (
    <div className="space-y-5">
      <PanelSection title="Product layout" description="Smart picks photo cards or compact rows for each section.">
        <Choice
          label="Product layout"
          value={draft.presentation}
          onChange={(presentation) => update((d) => ({ ...d, presentation }))}
          options={[
            { id: 'auto', label: 'Smart' },
            { id: 'grid', label: 'Photos' },
            { id: 'list', label: 'List' },
          ]}
        />
      </PanelSection>

      <PanelSection title="Sections" description={`${shown} of ${sections.length} shown · changes go live right away`}>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="small" onClick={() => setManaging(true)}>
            <FolderCog className="h-4 w-4" />
            Edit sections
          </Button>
          <Link
            to={vendorPaths.menu(storeId)}
            className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Edit items
          </Link>
        </div>
      </PanelSection>
      <ManageSectionsDialog open={managing} onOpenChange={setManaging} storeId={storeId} sections={sections} />
    </div>
  )
}
