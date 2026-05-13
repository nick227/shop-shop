/**
 * Grid of newest menu items across kitchens.
 */
import { Link } from 'react-router-dom'
import { Image } from '@shared/ui/primitives'
import { useNewestProducts } from '@shared/hooks/hooks/store'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { getImageUrl } from '@shared/lib/utils/image'
import type { ItemResponse } from '@api/types'

type ItemWithOptionalImage = ItemResponse & { readonly imageUrl?: string }

function ProductMiniCard({ item }: { readonly item: ItemResponse }) {
  const price = parsePrice(item.price)
  const href = getItemRouteSimple({ id: item.id, title: item.title })
  const row = item as ItemWithOptionalImage
  const imageUrl = getImageUrl(row.imageUrl, item.id, 'item', item.mediaAssets)

  return (
    <Link
      to={href}
      className="flex overflow-hidden flex-col rounded-xl border transition-colors border-border bg-card hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="overflow-hidden relative aspect-square bg-muted">
        <Image
          src={imageUrl}
          alt={item.title}
          fallbackSeed={item.id}
          aspectRatio="1/1"
          containerClassName="w-full h-full"
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">{item.title}</p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">{formatCurrency(price)}</p>
      </div>
    </Link>
  )
}

export function HomeNewestProducts() {
  const { data: products, isLoading } = useNewestProducts(8)

  return (
    <section className="p-4 rounded-2xl border border-border bg-card sm:p-6">
      <div className="flex gap-4 justify-between items-start">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">New products</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="animate-pulse aspect-square bg-muted" />
              <div className="space-y-1.5 p-3">
                <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="mt-0.5 h-4 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
          {(products ?? []).map((item) => (
            <ProductMiniCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
