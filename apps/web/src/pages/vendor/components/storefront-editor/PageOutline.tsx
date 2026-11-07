/**
 * PageOutline - the storefront as one list, top to bottom.
 * Fixed: hero brand, hero photos, ordering. Then `STOREFRONT_SECTIONS` (featured → menu → rest).
 */
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import {
  normalizeStorefrontConfig,
  STOREFRONT_SECTION_LABELS,
  type SectionSetting,
  type StorefrontConfig,
  type StorefrontSection,
} from '@packages/shared/storefront'
import type { StorefrontPartKey } from '@features/storefront/Storefront'
import { cn } from '@shared/lib/cn'

export type PanelKey = 'brand' | 'photos' | 'announcements' | 'featured' | 'bundles' | 'menu' | 'business'

/** Which settings open for each part of the page. */
export const PART_PANEL: Record<StorefrontPartKey, PanelKey> = {
  header: 'brand',
  ordering: 'business',
  announcements: 'announcements',
  bundles: 'bundles',
  featured: 'featured',
  categories: 'menu',
  menu: 'menu',
  about: 'business',
  gallery: 'photos',
  updates: 'business',
}

export const PANEL_TITLES: Record<PanelKey, string> = {
  brand: 'Brand & colors',
  photos: 'Photos',
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
  const sections = normalizeStorefrontConfig(draft).sections
  const change = (next: SectionSetting<StorefrontSection>[]) => onChange(next)

  return (
    <nav aria-label="Storefront parts" className="space-y-1">
      <FixedRow label="Hero & brand" detail={summary.header} onOpen={() => onOpen('header')} />
      <FixedRow label="Hero photos" detail={summary.gallery} onOpen={() => onOpen('gallery')} />
      <FixedRow label="Ordering details" detail={summary.ordering} onOpen={() => onOpen('ordering')} />
      <ol aria-label="Page sections" className="space-y-0.5 pt-3">
        {sections.map((section, index) => (
          <SectionRow
            key={section.key}
            label={STOREFRONT_SECTION_LABELS[section.key]}
            detail={summary[section.key]}
            visible={section.visible}
            onOpen={() => onOpen(section.key)}
            onToggle={
              section.key === 'menu'
                ? undefined
                : () => change(sections.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)))
            }
          />
        ))}
      </ol>
    </nav>
  )
}

function FixedRow({ label, detail, onOpen }: {
  readonly label: string
  readonly detail?: string
  readonly onOpen: () => void
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
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>
    </div>
  )
}

function SectionRow({ label, detail, visible, onOpen, onToggle }: {
  readonly label: string
  readonly detail?: string
  readonly visible: boolean
  readonly onOpen: () => void
  readonly onToggle?: () => void
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
      {onToggle ? (
        <button
          type="button"
          className={icon}
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={!visible}
        >
          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      ) : null}
    </li>
  )
}
