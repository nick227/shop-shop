import { Badge } from '@shared/ui/primitives'
import type { StoreHeaderStore, StoreHeaderTag } from './storeHeaderTypes'

const STORE_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  CONVENIENCE: 'Convenience store',
  GROCERY: 'Grocery',
  HOME_KITCHEN: 'Home kitchen',
  BAKERY: 'Bakery',
  RETAIL: 'Retail',
  OTHER: 'Other',
  MEAL_PREP: 'Meal prep',
  COFFEE: 'Coffee',
  SPECIALTY: 'Specialty',
  GENERAL: 'General',
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  BUDGET: 'Budget-friendly',
  MODERATE: 'Moderate',
  PREMIUM: 'Premium',
}

const TAG_CATEGORY_LABELS: Record<string, string> = {
  DIETARY: 'Dietary',
  FREE_FROM: 'Free from',
  CONTAINS_ALLERGEN: 'Contains',
  CUISINE: 'Cuisine',
  FEATURE: 'Features',
  MEAL_TIME: 'Meal time',
  ITEM_TYPE: 'Type',
  OCCASION: 'Occasion',
}

const TAG_CATEGORY_ORDER = [
  'CUISINE',
  'FEATURE',
  'MEAL_TIME',
  'OCCASION',
  'DIETARY',
  'FREE_FROM',
  'CONTAINS_ALLERGEN',
  'ITEM_TYPE',
] as const

function formatTagCategory(category: string): string {
  if (TAG_CATEGORY_LABELS[category]) return TAG_CATEGORY_LABELS[category]
  return category
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function compareTagCategories(a: string, b: string): number {
  const ai = TAG_CATEGORY_ORDER.indexOf(a as (typeof TAG_CATEGORY_ORDER)[number])
  const bi = TAG_CATEGORY_ORDER.indexOf(b as (typeof TAG_CATEGORY_ORDER)[number])
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}

function groupTagsByCategory(tags: readonly StoreHeaderTag[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const t of tags) {
    const label = t.label.trim()
    if (!label) continue
    const list = map.get(t.category) ?? []
    if (!list.some((x) => x.toLowerCase() === label.toLowerCase())) {
      list.push(label)
    }
    map.set(t.category, list)
  }
  return map
}

function normalizeKeywords(raw: StoreHeaderStore['searchKeywords']): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export interface StoreHeaderChipsProps {
  readonly store: StoreHeaderStore
}

export function StoreHeaderChips({ store }: StoreHeaderChipsProps) {
  const typeLabel = store.storeType ? (STORE_TYPE_LABELS[store.storeType] ?? store.storeType) : undefined
  const priceLabel = store.priceRange ? (PRICE_RANGE_LABELS[store.priceRange] ?? store.priceRange) : undefined
  const tagGroups = groupTagsByCategory(store.tags ?? [])
  const sortedCategories = [...tagGroups.keys()].sort(compareTagCategories)
  const keywords = normalizeKeywords(store.searchKeywords)

  const hasBusiness = Boolean(typeLabel ?? priceLabel)
  const hasTags = sortedCategories.length > 0
  const hasKeywords = keywords.length > 0

  if (!hasBusiness && !hasTags && !hasKeywords) {
    return undefined
  }

  return (
    <section aria-label="Store categories and tags" className="mt-6 space-y-4 border-t border-border pt-6">
      {hasBusiness ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business</h3>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {typeLabel ? (
              <li key="store-type">
                <Badge variant="secondary" className="font-medium">
                  {typeLabel}
                </Badge>
              </li>
            ) : undefined}
            {priceLabel ? (
              <li key="price-range">
                <Badge variant="secondary" className="font-medium">
                  {priceLabel}
                </Badge>
              </li>
            ) : undefined}
          </ul>
        </div>
      ) : undefined}

      {hasTags
        ? sortedCategories.map((category) => {
            const labels = tagGroups.get(category) ?? []
            return (
              <div key={category}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatTagCategory(category)}
                </h3>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {labels.map((label) => (
                    <li key={`${category}-${label}`}>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {label}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })
        : undefined}

      {hasKeywords ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keywords</h3>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {keywords.map((kw, i) => (
              <li key={`kw-${i}-${kw}`}>
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {kw}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : undefined}
    </section>
  )
}
