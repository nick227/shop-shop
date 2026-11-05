/**
 * A store's menu sections ("Breakfast", "Drinks") and how items fall into them.
 * Sections belong to the store and are ordered, described and hidden by the vendor; items point at one
 * through `sectionId`. The vendor menu and the shopper storefront group items with the same function.
 */

export interface MenuSection {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly sortIndex: number
  readonly isVisible: boolean
  /** Items in the section; in the shopper view, only items on sale. */
  readonly itemCount: number
}

export interface SectionedItem {
  readonly sectionId?: string | null
  readonly sortIndex?: number | null
  readonly title?: string
}

export interface MenuGroup<T> {
  /** The section id, or `NO_SECTION` for items not in any section. */
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly section: MenuSection | null
  readonly items: T[]
}

/** Group id for items that are not in any section. Never stored. */
export const NO_SECTION = '__no-section__'

export const MAX_SECTION_NAME = 120
export const MAX_SECTION_DESCRIPTION = 500

/** Trims and collapses whitespace, as the server does, so "Tacos " and "Tacos" are one section. */
export function normalizeSectionName(raw: string): string {
  return raw.trim().replaceAll(/\s+/g, ' ')
}

/** Same name as far as the server is concerned: names are unique per store, ignoring case. */
export function sameSectionName(a: string, b: string): boolean {
  return normalizeSectionName(a).localeCompare(normalizeSectionName(b), undefined, { sensitivity: 'base' }) === 0
}

const byMenuOrder = (a: SectionedItem, b: SectionedItem) =>
  (a.sortIndex ?? 0) - (b.sortIndex ?? 0) || (a.title ?? '').localeCompare(b.title ?? '')

/**
 * Items grouped by section, in the vendor's section order, each group in menu order.
 * Items without a known section come last under `unsectionedName`.
 * `includeEmpty` keeps sections with no items (the vendor's view); shoppers never see an empty section.
 */
export function groupItemsBySection<T extends SectionedItem>(
  items: readonly T[],
  sections: readonly MenuSection[],
  options: { readonly includeEmpty?: boolean; readonly unsectionedName: string },
): MenuGroup<T>[] {
  const ordered = [...sections].sort((a, b) => a.sortIndex - b.sortIndex)
  const known = new Set(ordered.map((section) => section.id))
  const bySection = new Map<string, T[]>()
  const unsectioned: T[] = []
  for (const item of items) {
    const id = item.sectionId
    if (id && known.has(id)) {
      const list = bySection.get(id)
      if (list) list.push(item)
      else bySection.set(id, [item])
    } else {
      unsectioned.push(item)
    }
  }

  const groups: MenuGroup<T>[] = ordered
    .map((section) => ({
      id: section.id,
      name: section.name,
      description: section.description,
      section,
      items: [...(bySection.get(section.id) ?? [])].sort(byMenuOrder),
    }))
    .filter((group) => options.includeEmpty || group.items.length > 0)

  if (unsectioned.length > 0) {
    groups.push({
      id: NO_SECTION,
      name: options.unsectionedName,
      description: null,
      section: null,
      items: [...unsectioned].sort(byMenuOrder),
    })
  }
  return groups
}

/** Whether an item matches a shopper's or vendor's search text, by title or description. */
export function matchesMenuSearch(item: { title?: string; description?: string | null }, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (item.title ?? '').toLowerCase().includes(needle) || (item.description ?? '').toLowerCase().includes(needle)
}
