/**
 * Grid of newest menu items (compact cards).
 */
import { Link } from 'react-router-dom'
import { useNewestProducts } from '@shared/hooks/hooks/store'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import type { ItemResponse } from '@api/types'

function ProductMiniCard({ item }: { readonly item: ItemResponse }) {
  const price = parsePrice(item.price)
  const href = getItemRouteSimple({ id: item.id, title: item.title })

  return (
    <Link
      to={href}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="aspect-square bg-muted" aria-hidden />
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{item.title}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(price)}</p>
      </div>
    </Link>
  )
}

export function HomeNewestProducts() {
  const { data: products, isLoading } = useNewestProducts(8)

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">New on menus</h2>
      <p className="mt-1 text-sm text-muted-foreground">Recently listed dishes across kitchens.</p>
      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
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
