import {
  Flame, UtensilsCrossed, ChefHat, Coffee, Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface StoreTypeConfig {
  /** DB enum value sent to API (empty string = no filter) */
  value: string
  /** URL ?browse= slug */
  slug: string
  /** Display label */
  label: string
  Icon: LucideIcon
}

export const STORE_TYPE_CONFIG: readonly StoreTypeConfig[] = [
  { value: '',          slug: '',          label: 'All',         Icon: Flame           },
  { value: 'MEAL_PREP', slug: 'meal-prep', label: 'Meal prep',   Icon: UtensilsCrossed },
  { value: 'BAKERY',    slug: 'bakery',    label: 'Baked goods', Icon: ChefHat         },
  { value: 'COFFEE',    slug: 'coffee',    label: 'Coffee',      Icon: Coffee          },
  { value: 'SPECIALTY', slug: 'specialty', label: 'Specialty',   Icon: Sparkles        },
]

/** slug → API value  (e.g. 'meal-prep' → 'MEAL_PREP') */
export const SLUG_TO_STORE_TYPE = Object.fromEntries(
  STORE_TYPE_CONFIG.filter((t) => t.slug).map((t) => [t.slug, t.value]),
)

/** API value → display label  (e.g. 'MEAL_PREP' → 'Meal prep') */
export const STORE_TYPE_LABEL = Object.fromEntries(
  STORE_TYPE_CONFIG.filter((t) => t.value).map((t) => [t.value, t.label]),
)
