import { LayoutGrid, ShoppingBag, ShoppingBasket, Store, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface StoreTypeConfig {
  /** API vertical or enum sent as storeType. Empty string clears the filter. */
  value: string
  /** URL ?browse= slug */
  slug: string
  label: string
  Icon: LucideIcon
}

/** Broad marketplace entrances. Food covers kitchens, bakeries, and coffee. */
export const STORE_TYPE_CONFIG: readonly StoreTypeConfig[] = [
  { value: '', slug: '', label: 'All', Icon: LayoutGrid },
  { value: 'FOOD', slug: 'food', label: 'Food', Icon: UtensilsCrossed },
  { value: 'GROCERY', slug: 'grocery', label: 'Grocery', Icon: ShoppingBasket },
  { value: 'CONVENIENCE', slug: 'convenience', label: 'Convenience', Icon: Store },
  { value: 'RETAIL', slug: 'retail', label: 'Retail', Icon: ShoppingBag },
]

/** Vertical key → concrete store types stored on merchants. */
export const STORE_TYPE_GROUPS: Record<string, readonly string[]> = {
  FOOD: ['RESTAURANT', 'HOME_KITCHEN', 'BAKERY', 'COFFEE', 'MEAL_PREP'],
  GROCERY: ['GROCERY'],
  CONVENIENCE: ['CONVENIENCE'],
  RETAIL: ['RETAIL', 'SPECIALTY', 'OTHER', 'GENERAL'],
}

const LEGACY_SLUGS: Record<string, string> = {
  'meal-prep': 'MEAL_PREP',
  bakery: 'BAKERY',
  coffee: 'COFFEE',
  specialty: 'SPECIALTY',
}

/** slug → API value (e.g. 'food' → 'FOOD', 'meal-prep' → 'MEAL_PREP') */
export const SLUG_TO_STORE_TYPE: Record<string, string> = {
  ...Object.fromEntries(STORE_TYPE_CONFIG.filter((t) => t.slug).map((t) => [t.slug, t.value])),
  ...LEGACY_SLUGS,
}

/** API value → display label */
export const STORE_TYPE_LABEL: Record<string, string> = {
  FOOD: 'Food',
  GROCERY: 'Grocery',
  CONVENIENCE: 'Convenience',
  RETAIL: 'Retail',
  RESTAURANT: 'Restaurant',
  HOME_KITCHEN: 'Home kitchen',
  BAKERY: 'Bakery',
  COFFEE: 'Coffee',
  MEAL_PREP: 'Meal prep',
  SPECIALTY: 'Specialty',
  OTHER: 'Shop',
  GENERAL: 'Shop',
}
