import type { ItemResponse } from '@api/types'

const ITEM_TYPE_ORDER = [
  'entree', 'sandwich', 'salad', 'side', 'bread',
  'pastry', 'cake', 'dessert', 'drink',
  'tray', 'family-meal', 'box', 'bundle-item',
] as const

export function groupItemsByMenuType(items: ItemResponse[]): { label: string; items: ItemResponse[] }[] {
  const ungrouped: ItemResponse[] = []
  const grouped = new Map<string, { label: string; items: ItemResponse[] }>()

  for (const item of items) {
    const typeTag = item.tags?.find((t) => t.category === 'ITEM_TYPE')
    if (!typeTag) {
      ungrouped.push(item)
      continue
    }
    const existing = grouped.get(typeTag.slug)
    if (existing) {
      existing.items.push(item)
    } else {
      grouped.set(typeTag.slug, { label: typeTag.label, items: [item] })
    }
  }

  const sections = [...grouped.entries()]
    .sort(([a], [b]) => {
      const ai = ITEM_TYPE_ORDER.indexOf(a as (typeof ITEM_TYPE_ORDER)[number])
      const bi = ITEM_TYPE_ORDER.indexOf(b as (typeof ITEM_TYPE_ORDER)[number])
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    .map(([, section]) => section)

  if (ungrouped.length > 0) {
    const label = sections.length === 0 ? 'Menu' : 'Other'
    if (sections.length === 0) return [{ label, items: ungrouped }]
    sections.push({ label, items: ungrouped })
  }

  return sections
}
