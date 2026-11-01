/**
 * Menu categories belong to the store. A category is the label a vendor typed on an item
 * (stored at `optionsJson.category`); the store's categories are the labels its items use.
 * Nothing here comes from a platform-wide list.
 */

interface CategorizedItem {
  readonly optionsJson?: Record<string, unknown> | null
  readonly sortIndex?: number | null
  readonly title?: string
}

export interface MenuCategory {
  readonly name: string
  readonly count: number
}

/** Label shown for items with no category. Never stored. */
export const UNCATEGORIZED = 'Uncategorized'

/** Trims and collapses whitespace so "Tacos " and "tacos" don't become two categories by accident. */
export function normalizeCategory(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().replaceAll(/\s+/g, ' ') : ''
}

export function itemCategory(item: CategorizedItem): string {
  return normalizeCategory(item.optionsJson?.category)
}

const sameName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0

/**
 * The store's categories in menu order: a category sits where its first item (by sortIndex) sits.
 * Names differing only by case are one category, spelled as first seen.
 */
export function storeCategories(items: readonly CategorizedItem[]): MenuCategory[] {
  const ordered = [...items].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
  const found: { name: string; count: number }[] = []
  for (const item of ordered) {
    const name = itemCategory(item)
    if (!name) continue
    const existing = found.find((c) => sameName(c.name, name))
    if (existing) existing.count += 1
    else found.push({ name, count: 1 })
  }
  return found
}

/** Whether the item belongs to the named category; `UNCATEGORIZED` matches items with none. */
export function inCategory(item: CategorizedItem, category: string): boolean {
  const name = itemCategory(item)
  if (category === UNCATEGORIZED) return name === ''
  return name !== '' && sameName(name, category)
}

/** The existing spelling of a category the vendor typed, so new items join it instead of forking it. */
export function canonicalCategory(typed: string, existing: readonly MenuCategory[]): string {
  const name = normalizeCategory(typed)
  return existing.find((c) => sameName(c.name, name))?.name ?? name
}
