/**
 * The storefront menu: a sticky bar (search, a link per section, and a directory of every section for
 * big catalogs) and the sections themselves, each laid out for what it holds.
 *
 * Structure comes from the vendor (sections, order, descriptions); presentation is decided here. Every
 * item stays reachable: by scrolling, by jumping to its section, by search, or by "Show all" in a long
 * section of a big catalog.
 */
import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, Search, X } from 'lucide-react'
import type { ItemResponse } from '@api/types'
import type { StorefrontPresentation } from '@packages/shared/storefront'
import { cn } from '@shared/lib/cn'
import type { MenuGroup } from '@shared/lib/menu/menuSections'
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/primitives/ui/Dialog'
import { useStorefrontActions } from '../context'
import { ProductTile, itemImage } from './ProductTile'

export const sectionAnchor = (id: string) => `menu-section-${id}`

/** A catalog this large shows long sections in part, with "Show all", so the page stays scannable. */
export const LARGE_CATALOG_ITEMS = 150
const LONG_SECTION_ITEMS = 12
/** Items shown before Show all: four rows of two, or three rows of three for text-only lists. */
const PREVIEW_ITEMS = 8
const PREVIEW_ITEMS_DENSE = 9
/** Sections beyond this many get a directory sheet next to the section links. */
const DIRECTORY_SECTIONS = 6

type Layout = 'feature' | 'grid' | 'list'

/**
 * How a section shows its items. With `auto`: one or two pictured items get large cards, a mostly
 * pictured section of up to a dozen gets a photo grid, anything longer or text-heavy gets compact rows.
 */
export function sectionLayout(items: readonly ItemResponse[], presentation: StorefrontPresentation): Layout {
  if (presentation === 'grid') return 'grid'
  if (presentation === 'list') return 'list'
  const pictured = items.filter((item) => itemImage(item)).length
  if (items.length <= 2 && pictured === items.length) return 'feature'
  if (items.length <= 12 && pictured / Math.max(1, items.length) >= 0.6) return 'grid'
  return 'list'
}

function scrollTop(root: HTMLElement | null): number {
  return root ? root.scrollTop : window.scrollY
}

function topWithin(element: HTMLElement, root: HTMLElement | null): number {
  const rootTop = root ? root.getBoundingClientRect().top : 0
  return element.getBoundingClientRect().top - rootTop
}

export function scrollToSection(id: string, root: HTMLElement | null, offset: number) {
  const target = (root ?? document).querySelector<HTMLElement>(`#${CSS.escape(sectionAnchor(id))}`)
  if (!target) return
  const top = topWithin(target, root) + scrollTop(root) - offset
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const options: ScrollToOptions = { top, behavior: reduceMotion ? 'auto' : 'smooth' }
  if (root) root.scrollTo?.(options)
  else window.scrollTo(options)
  target.focus({ preventScroll: true })
}

// ---------------------------------------------------------------------------
// Sticky bar
// ---------------------------------------------------------------------------

export function MenuBar({ groups, query, onQuery, activeId, onJump, onHeight }: {
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly query: string
  readonly onQuery: (query: string) => void
  readonly activeId: string | undefined
  readonly onJump: (id: string) => void
  /** Reports the bar's height, so jumps land just below it. */
  readonly onHeight: (height: number) => void
}) {
  const { store, stickyTop } = useStorefrontActions()
  const barRef = useRef<HTMLDivElement>(null)
  const [directory, setDirectory] = useState(false)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const report = () => onHeight(bar.offsetHeight)
    report()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(report)
    observer?.observe(bar)
    return () => observer?.disconnect()
  }, [onHeight])

  return (
    <div ref={barRef} className="sf-menubar sticky z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur" style={{ top: stickyTop }}>
      <MenuSearch value={query} onChange={onQuery} storeName={store.name} />
      {groups.length > 1 && !query.trim() ? (
        <nav aria-label="Menu sections" className="flex min-w-0 items-center gap-1">
          {groups.length > DIRECTORY_SECTIONS ? (
            <button
              type="button"
              onClick={() => setDirectory(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              aria-haspopup="dialog"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              All
            </button>
          ) : null}
          <SectionLinks groups={groups} activeId={activeId} onJump={onJump} />
        </nav>
      ) : null}
      <SectionDirectory
        open={directory}
        onOpenChange={setDirectory}
        groups={groups}
        onJump={(id) => {
          setDirectory(false)
          // Let the sheet close before scrolling, so focus returns to the page first.
          requestAnimationFrame(() => onJump(id))
        }}
      />
    </div>
  )
}

function MenuSearch({ value, onChange, storeName }: {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly storeName: string
}) {
  return (
    <div className="sf-menubar-search relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange('')
        }}
        placeholder={`Search ${storeName}`}
        aria-label={`Search ${storeName}’s menu`}
        className="h-10 w-full rounded-full border border-input bg-muted/40 pl-9 pr-9 text-sm focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

function SectionLinks({ groups, activeId, onJump }: {
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly activeId: string | undefined
  readonly onJump: (id: string) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  // Keep the current section's link in view as the shopper scrolls the menu.
  useEffect(() => {
    const row = rowRef.current
    const chip = activeId ? row?.querySelector<HTMLElement>(`[data-section="${CSS.escape(activeId)}"]`) : null
    if (!row || !chip) return
    // Measured on screen: offsetLeft would count from the sticky bar, search box included.
    const rowBox = row.getBoundingClientRect()
    const chipBox = chip.getBoundingClientRect()
    const left = row.scrollLeft + (chipBox.left - rowBox.left) - row.clientWidth / 2 + chipBox.width / 2
    row.scrollTo?.({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeId])

  return (
    <div ref={rowRef} className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
      {groups.map((group) => {
        const active = group.id === activeId
        return (
          <a
            key={group.id}
            href={`#${sectionAnchor(group.id)}`}
            data-section={group.id}
            aria-current={active ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault()
              onJump(group.id)
            }}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {group.name}
          </a>
        )
      })}
    </div>
  )
}

/** Every section with its size, for catalogs with more sections than fit in the bar. */
function SectionDirectory({ open, onOpenChange, groups, onJump }: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly onJump: (id: string) => void
}) {
  const { theme } = useStorefrontActions()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={theme.style}
        className={cn(
          theme.className,
          'bottom-0 top-auto max-h-[85vh] max-w-lg translate-y-0 gap-3 overflow-y-auto rounded-t-2xl p-5 sm:bottom-auto sm:top-[50%] sm:translate-y-[-50%] sm:rounded-2xl',
        )}
      >
        <DialogTitle className="sf-heading text-xl font-bold">All sections</DialogTitle>
        <ul className="grid grid-cols-2 gap-1">
          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onJump(group.id)}
                className="flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{group.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{group.items.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export function MenuSections({ groups, presentation, jumpOffset, large }: {
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly presentation: StorefrontPresentation
  readonly jumpOffset: number
  /** A big catalog: long sections show their first items and a "Show all". */
  readonly large: boolean
}) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <MenuSection key={group.id} group={group} presentation={presentation} jumpOffset={jumpOffset} large={large} />
      ))}
    </div>
  )
}

function MenuSection({ group, presentation, jumpOffset, large }: {
  readonly group: MenuGroup<ItemResponse>
  readonly presentation: StorefrontPresentation
  readonly jumpOffset: number
  readonly large: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const layout = sectionLayout(group.items, presentation)
  const dense = layout === 'list' && group.items.every((item) => !itemImage(item))
  const partial = large && group.items.length > LONG_SECTION_ITEMS && !expanded
  const items = partial ? group.items.slice(0, dense ? PREVIEW_ITEMS_DENSE : PREVIEW_ITEMS) : group.items

  return (
    <section
      id={sectionAnchor(group.id)}
      aria-labelledby={`${sectionAnchor(group.id)}-title`}
      tabIndex={-1}
      className="sf-menu-section space-y-3 outline-none"
      style={{ scrollMarginTop: jumpOffset }}
    >
      <header className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 id={`${sectionAnchor(group.id)}-title`} className="sf-heading text-xl font-bold text-foreground">
            {group.name}
          </h2>
          {group.description ? <p className="text-sm text-muted-foreground">{group.description}</p> : null}
        </div>
        {large ? <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{group.items.length} items</span> : null}
      </header>
      {layout === 'list' ? (
        <div className="sf-list" data-dense={dense || undefined}>
          {items.map((item) => (
            <ProductTile key={item.id} item={item} variant="row" />
          ))}
        </div>
      ) : (
        <div className="sf-grid" data-size={layout === 'feature' ? 'feature' : undefined}>
          {items.map((item) => (
            <ProductTile key={item.id} item={item} variant="card" />
          ))}
        </div>
      )}
      {partial ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Show all {group.items.length} in {group.name}
        </button>
      ) : null}
    </section>
  )
}

/** The section at the top of the reading area: the last one whose heading has scrolled under the bars. */
export function useActiveSection(ids: readonly string[], root: HTMLElement | null, offset: number): string | undefined {
  const [active, setActive] = useState<string | undefined>()
  const key = ids.join('|')

  useEffect(() => {
    if (ids.length === 0) return
    const scope: ParentNode = root ?? document
    const target: HTMLElement | Window = root ?? window
    const update = () => {
      // Nothing is current until the menu itself reaches the top.
      let current: string | undefined
      for (const id of ids) {
        const element = scope.querySelector<HTMLElement>(`#${CSS.escape(sectionAnchor(id))}`)
        if (element && topWithin(element, root) - offset <= 1) current = id
      }
      // At the very bottom, the last section is current even if it is too short to reach the top.
      const viewport = root ? root.clientHeight : window.innerHeight
      const height = root ? root.scrollHeight : document.documentElement.scrollHeight
      if (scrollTop(root) > 0 && viewport + scrollTop(root) >= height - 2) current = ids.at(-1)!
      setActive(current)
    }
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for `ids`
  }, [key, root, offset])

  return active
}
