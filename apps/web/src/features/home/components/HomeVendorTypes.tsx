/**
 * Curated vendor categories — horizontal-scroll pill row on mobile, wraps on desktop.
 */
import { useNavigate } from 'react-router-dom'
import { Flame, UtensilsCrossed, ChefHat, Coffee, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const CATEGORIES: readonly { id: string; label: string; Icon: LucideIcon }[] = [
  { id: '',          label: 'All kitchens',   Icon: Flame           },
  { id: 'meal-prep', label: 'Meal prep',       Icon: UtensilsCrossed },
  { id: 'bakery',    label: 'Baked goods',     Icon: ChefHat         },
  { id: 'coffee',    label: 'Coffee & drinks', Icon: Coffee          },
  { id: 'specialty', label: 'Specialty',       Icon: Sparkles        },
]

export function HomeVendorTypes() {
  const navigate = useNavigate()

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Browse by type</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {CATEGORIES.map(({ id, label, Icon }) => (
          <button
            key={id || 'all'}
            type="button"
            onClick={() =>
              navigate({ pathname: '/search', search: id ? `browse=${encodeURIComponent(id)}` : '' })
            }
            className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
