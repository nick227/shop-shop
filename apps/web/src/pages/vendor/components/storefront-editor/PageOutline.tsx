/**
 * PageOutline - the storefront as a list of its parts, top to bottom. Each part opens its own settings;
 * optional parts can be shown, hidden and moved right here. The menu and the business header are fixed.
 */
import { ArrowDown, ArrowUp, ChevronRight, Eye, EyeOff, Lock } from 'lucide-react'
import {
  STOREFRONT_SECTION_LABELS,
  type AfterMenuSection,
  type BeforeMenuSection,
  type SectionSetting,
  type StorefrontConfig,
} from '@packages/shared/storefront'
import type { StorefrontPartKey } from '@features/storefront/Storefront'
import { cn } from '@shared/lib/cn'
import { moveInList } from './controls'

export type PanelKey = 'brand' | 'mosaic' | 'announcements' | 'featured' | 'bundles' | 'menu' | 'business'

/** Which settings open for each part of the page. */
export const PART_PANEL: Record<StorefrontPartKey, PanelKey> = {
  header: 'brand',
  ordering: 'business',
  mosaic: 'mosaic',
  announcements: 'announcements',
  bundles: 'bundles',
  featured: 'featured',
  categories: 'menu',
  menu: 'menu',
  about: 'business',
  gallery: 'mosaic',
  updates: 'business',
}

export const PANEL_TITLES: Record<PanelKey, string> = {
  brand: 'Brand & colors',
  mosaic: 'Photos & mosaic',
  announcements: 'Announcements',
  featured: 'Featured products',
  bundles: 'Bundles',
  menu: 'Menu',
  business: 'Business details',
}

/** A short state for each part, so the outline says what's there without opening it. */
export type OutlineSummary = Readonly<Partial<Record<StorefrontPartKey, string>>>

export function PageOutline({ draft, summary, onOpen, onChange }: {
  readonly draft: StorefrontConfig
  readonly summary: OutlineSummary
  readonly onOpen: (part: StorefrontPartKey) => void
  readonly onChange: (sections: StorefrontConfig['sections']) => void
}) {
  const { beforeMenu, afterMenu } = draft.sections
  const setBefore = (next: SectionSetting<BeforeMenuSection>[]) => onChange({ beforeMenu: next, afterMenu })
  const setAfter = (next: SectionSetting<AfterMenuSection>[]) => onChange({ beforeMenu, afterMenu: next })

  return (
    <nav aria-label="Storefront parts" className="space-y-1">
      <FixedRow label="Brand & colors" detail={summary.header} onOpen={() => onOpen('header')} />
      <FixedRow label="Business details" detail={summary.ordering} onOpen={() => onOpen('ordering')} />
      <Group label="Above the menu">
        {beforeMenu.map((section, index) => (
          <SectionRow
            key={section.key}
            label={STOREFRONT_SECTION_LABELS[section.key]}
            detail={summary[section.key]}
            visible={section.visible}
            first={index === 0}
            last={index === beforeMenu.length - 1}
            onOpen={() => onOpen(section.key)}
            onToggle={() => setBefore(beforeMenu.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)))}
            onMove={(offset) => setBefore(moveInList(beforeMenu, index, offset))}
          />
        ))}
      </Group>
      <FixedRow label="Menu" detail={summary.menu} onOpen={() => onOpen('menu')} locked />
      <Group label="Below the menu">
        {afterMenu.map((section, index) => (
          <SectionRow
            key={section.key}
            label={STOREFRONT_SECTION_LABELS[section.key]}
            detail={summary[section.key]}
            visible={section.visible}
            first={index === 0}
            last={index === afterMenu.length - 1}
            onOpen={() => onOpen(section.key)}
            onToggle={() => setAfter(afterMenu.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)))}
            onMove={(offset) => setAfter(moveInList(afterMenu, index, offset))}
          />
        ))}
      </Group>
    </nav>
  )
}

function Group({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="pt-3">
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ol className="space-y-0.5" aria-label={label}>
        {children}
      </ol>
    </div>
  )
}

function FixedRow({ label, detail, onOpen, locked = false }: {
  readonly label: string
  readonly detail?: string
  readonly onOpen: () => void
  readonly locked?: boolean
}) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          {detail ? <span className="block truncate text-xs text-muted-foreground">{detail}</span> : null}
        </span>
        {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Always shown" /> : null}
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>
    </div>
  )
}

function SectionRow({ label, detail, visible, first, last, onOpen, onToggle, onMove }: {
  readonly label: string
  readonly detail?: string
  readonly visible: boolean
  readonly first: boolean
  readonly last: boolean
  readonly onOpen: () => void
  readonly onToggle: () => void
  readonly onMove: (offset: -1 | 1) => void
}) {
  const icon = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30'
  return (
    <li className={cn('group flex items-center gap-1 rounded-lg pr-1 hover:bg-muted', !visible && 'opacity-60')}>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{visible ? detail ?? 'Shown' : 'Hidden'}</span>
        </span>
      </button>
      <span className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" className={icon} disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}>
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" className={icon} disabled={last} onClick={() => onMove(1)} aria-label={`Move ${label} down`}>
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </span>
      <button
        type="button"
        className={icon}
        onClick={onToggle}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={!visible}
      >
        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </li>
  )
}
