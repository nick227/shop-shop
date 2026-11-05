/**
 * Layout: which optional sections show and in what order, and how products are presented.
 * The menu itself always shows; business content always follows it so shoppers reach products first.
 */
import { UtensilsCrossed } from 'lucide-react'
import {
  STOREFRONT_SECTION_LABELS,
  type AfterMenuSection,
  type BeforeMenuSection,
  type SectionSetting,
} from '@packages/shared/storefront'
import { Choice, OrderedRow, PanelSection, moveInList } from './controls'
import type { PanelProps } from './types'

export function LayoutPanel({ draft, update }: PanelProps) {
  const setBefore = (beforeMenu: SectionSetting<BeforeMenuSection>[]) =>
    update((d) => ({ ...d, sections: { ...d.sections, beforeMenu } }))
  const setAfter = (afterMenu: SectionSetting<AfterMenuSection>[]) =>
    update((d) => ({ ...d, sections: { ...d.sections, afterMenu } }))

  return (
    <div className="space-y-5">
      <PanelSection title="Page sections" description="Show, hide and reorder what appears around your menu.">
        <SectionList list={draft.sections.beforeMenu} onChange={setBefore} label="Above the menu" />
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-2 text-sm text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4" aria-hidden />
          Menu — always shown
        </div>
        <SectionList list={draft.sections.afterMenu} onChange={setAfter} label="Below the menu" />
      </PanelSection>

      <PanelSection
        title="Product presentation"
        description="Smart picks a layout per section: large cards for one or two pictured items, a photo grid for short pictured sections, compact rows for long ones."
      >
        <Choice
          label="Product presentation"
          value={draft.presentation}
          onChange={(presentation) => update((d) => ({ ...d, presentation }))}
          options={[
            { id: 'auto', label: 'Smart' },
            { id: 'grid', label: 'Photo grid' },
            { id: 'list', label: 'Compact list' },
          ]}
        />
      </PanelSection>
    </div>
  )
}

function SectionList<K extends BeforeMenuSection | AfterMenuSection>({ list, onChange, label }: {
  readonly list: readonly SectionSetting<K>[]
  readonly onChange: (list: SectionSetting<K>[]) => void
  readonly label: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ol className="space-y-1.5" aria-label={label}>
        {list.map((section, index) => (
          <OrderedRow
            key={section.key}
            label={STOREFRONT_SECTION_LABELS[section.key]}
            index={index}
            count={list.length}
            visible={section.visible}
            onToggleVisible={() => onChange(list.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)))}
            onMove={(offset) => onChange(moveInList(list, index, offset))}
          >
            <span className="text-sm">{STOREFRONT_SECTION_LABELS[section.key]}</span>
          </OrderedRow>
        ))}
      </ol>
    </div>
  )
}
