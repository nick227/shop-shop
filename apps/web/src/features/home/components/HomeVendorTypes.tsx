/**
 * Curated vendor themes — small cards; real taxonomy can replace this later.
 */
import { useNavigate } from 'react-router-dom'

const VENDOR_TYPES: readonly { readonly id: string; readonly label: string; readonly description: string }[] = [
  { id: 'meal-prep', label: 'Meal prep', description: 'Planned meals & catering' },
  { id: 'bakery', label: 'Baked goods', description: 'Bread, pastries, desserts' },
  { id: 'coffee', label: 'Coffee & drinks', description: 'Cafés, drinks' },
  { id: 'specialty', label: 'Specialty', description: 'Artisan & gifts' },
]

export function HomeVendorTypes() {
  const navigate = useNavigate()

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Categories</h2>
      <p className="mt-1 text-sm text-muted-foreground">How sellers tend to show up — filters will follow.</p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {VENDOR_TYPES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                navigate({ pathname: '/search', search: `browse=${encodeURIComponent(t.id)}` })
              }}
              className="flex w-full flex-col rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors hover:border-primary/40"
            >
              <span className="font-medium text-foreground">{t.label}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{t.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
