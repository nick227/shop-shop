/**
 * Marketplace type entrances. Search owns the same four verticals.
 */
import { useNavigate } from 'react-router-dom'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'

export function HomeVendorTypes() {
  const navigate = useNavigate()
  const types = STORE_TYPE_CONFIG.filter((type) => type.slug)

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Browse by type</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {types.map(({ slug, label, Icon }) => (
          <button
            key={slug}
            type="button"
            onClick={() => navigate({ pathname: '/search', search: `browse=${encodeURIComponent(slug)}` })}
            className="inline-flex min-h-11 flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
