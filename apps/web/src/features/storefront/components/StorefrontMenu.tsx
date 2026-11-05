/**
 * StorefrontMenu - the full menu: the vendor's sections in the vendor's order, a sticky bar with search
 * and a link per section that follows the scroll, and each section laid out for what it holds.
 *
 * Structure comes from the vendor (sections, order, descriptions); presentation is decided here.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { ItemResponse } from '@api/types'
import type { StorefrontPresentation } from '@packages/shared/storefront'
import { cn } from '@shared/lib/cn'
import { matchesMenuSearch, type MenuGroup } from '@shared/lib/menu/menuSections'
import { useStorefrontActions } from '../context'
import { ProductTile, itemImage } from './ProductTile'

/** Height of the sticky section bar, so a jump lands the section heading just below it. */
const BAR_HEIGHT_PX = 104

export const sectionAnchor = (id: string) => `menu-section-${id}`

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

export function StorefrontMenu({ groups, presentation }: {
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly presentation: StorefrontPresentation
}) {
  const { store, stickyTop, scrollRoot } = useStorefrontActions()
  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0
  const jumpOffset = stickyTop + BAR_HEIGHT_PX

  const shown = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, items: group.items.filter((item) => matchesMenuSearch(item, query)) }))
        .filter((group) => group.items.length > 0),
    [groups, query],
  )
  const resultCount = shown.reduce((sum, group) => sum + group.items.length, 0)
  const activeId = useActiveSection(
    shown.map((group) => group.id),
    scrollRoot,
    jumpOffset,
  )
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0)
  // A short menu with one section needs no navigation.
  const showNav = groups.length > 1 || totalItems > 6

  return (
    <div className="space-y-6">
      {showNav ? (
        <div
          className="sticky z-20 -mx-4 space-y-2 border-b border-border bg-background/95 px-4 pb-2 pt-3 backdrop-blur"
          style={{ top: stickyTop }}
        >
          <MenuSearch value={query} onChange={setQuery} storeName={store.name} />
          {shown.length > 1 ? (
            <SectionBar groups={shown} activeId={activeId} onJump={(id) => scrollToSection(id, scrollRoot, jumpOffset)} />
          ) : null}
        </div>
      ) : null}

      {searching ? (
        <p className="text-sm text-muted-foreground" role="status">
          {resultCount === 0
            ? `Nothing on the menu matches “${query.trim()}”.`
            : `${resultCount} ${resultCount === 1 ? 'item matches' : 'items match'} “${query.trim()}”`}
        </p>
      ) : null}

      {shown.map((group) => {
        const layout = sectionLayout(group.items, presentation)
        return (
          <section
            key={group.id}
            id={sectionAnchor(group.id)}
            aria-labelledby={`${sectionAnchor(group.id)}-title`}
            tabIndex={-1}
            className="space-y-3 outline-none"
            style={{ scrollMarginTop: jumpOffset }}
          >
            <header className="space-y-1">
              <h2 id={`${sectionAnchor(group.id)}-title`} className="sf-heading text-xl font-bold text-foreground">
                {group.name}
              </h2>
              {group.description ? <p className="text-sm text-muted-foreground">{group.description}</p> : null}
            </header>
            {layout === 'list' ? (
              <div className="sf-list">
                {group.items.map((item) => (
                  <ProductTile key={item.id} item={item} variant="row" />
                ))}
              </div>
            ) : (
              <div className="sf-grid" data-size={layout === 'feature' ? 'feature' : undefined}>
                {group.items.map((item) => (
                  <ProductTile key={item.id} item={item} variant="card" />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function MenuSearch({ value, onChange, storeName }: {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly storeName: string
}) {
  return (
    <div className="relative">
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
        className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
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

function SectionBar({ groups, activeId, onJump }: {
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly activeId: string | undefined
  readonly onJump: (id: string) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)

  // Keep the current section's link in view as the shopper scrolls the menu.
  useEffect(() => {
    const bar = barRef.current
    const chip = activeId ? bar?.querySelector<HTMLElement>(`[data-section="${CSS.escape(activeId)}"]`) : null
    if (!bar || !chip) return
    const left = chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2
    bar.scrollTo?.({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeId])

  return (
    <nav aria-label="Menu sections">
      <div ref={barRef} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
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
    </nav>
  )
}

/** The section at the top of the reading area: the last one whose heading has scrolled under the bars. */
function useActiveSection(ids: readonly string[], root: HTMLElement | null, offset: number): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0])
  const key = ids.join('|')

  useEffect(() => {
    if (ids.length === 0) return
    const scope: ParentNode = root ?? document
    const target: HTMLElement | Window = root ?? window
    const update = () => {
      let current = ids[0]
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
