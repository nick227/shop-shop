/**
 * Grid of newest menu items across kitchens.
 */
import { Link } from 'react-router-dom'
import { useNewestProducts } from '@shared/hooks/hooks/store'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { getImageUrl } from '@shared/lib/utils/image'
import type { ItemResponse } from '@api/types'

function ProductMiniCard({ item }: { readonly item: ItemResponse }) {
  const price = parsePrice(item.price)
  const href = getItemRouteSimple({ id: item.id, title: item.title })
  const imageUrl = getImageUrl(undefined, item.id, 'product')

  return (
    <Link
      to={href}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{item.title}</p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">{formatCurrency(price)}</p>
      </div>
    </Link>
  )
}

export function HomeNewestProducts() {
  const { data: products, isLoading } = useNewestProducts(8)

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">New on menus</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Recently listed dishes across kitchens.</p>
        </div>
        <Link
          to="/search"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="space-y-1.5 p-3">
                <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="mt-0.5 h-4 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(products ?? []).map((item) => (
            <ProductMiniCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
