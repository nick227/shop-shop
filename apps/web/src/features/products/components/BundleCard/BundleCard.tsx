import { useState } from 'react'
import { Card, Badge, Button, Image } from '@shared/ui/primitives'
import { useAddBundleToCart } from '@shared/hooks/hooks/useAddBundleToCart'
import { formatCurrency } from '@shared/lib/utils/format'
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'

export interface BundleItem {
  itemId: string
  title: string
  price: number
  quantity: number
}

export interface BundleCardProps {
  bundle: {
    id: string
    name: string
    description?: string | null
    isActive?: boolean
    imageUrl?: string | null
    items?: BundleItem[]
    pricing?: { pricingType: string; showSavings?: boolean; savingsLabel?: string } | null
    resolvedPrice: number
    itemSum?: number
    savings?: number
  }
  store: { id: string; name: string }
}

export function BundleCard({ bundle, store }: BundleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const addBundleToCart = useAddBundleToCart()

  const savings = bundle.savings ?? (bundle.itemSum ? bundle.itemSum - bundle.resolvedPrice : 0)
  const showSavings = bundle.pricing?.showSavings !== false && savings > 0.005
  const unavailable = !bundle.isActive || (bundle.items !== undefined && bundle.items.length === 0)

  const handleAddToCart = () => {
    addBundleToCart.mutate({
      storeId: store.id,
      bundleId: bundle.id,
      title: bundle.name,
      unitPrice: bundle.resolvedPrice,
      bundleItems: bundle.items,
    })
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card transition-colors hover:border-primary/40">
      <Image
        src={bundle.imageUrl || ''}
        alt={bundle.name}
        fallbackSeed={bundle.id}
        aspectRatio="4/3"
        containerClassName="aspect-[4/3] w-full bg-muted"
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="text-xs font-medium text-primary border-primary/40">
              Bundle
            </Badge>
            <h4 className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-foreground">
              {bundle.name}
            </h4>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-bold text-foreground">
              {formatCurrency(bundle.resolvedPrice)}
            </div>
            {showSavings && bundle.itemSum && bundle.itemSum > bundle.resolvedPrice && (
              <div className="text-xs text-muted-foreground line-through">
                {formatCurrency(bundle.itemSum)}
              </div>
            )}
          </div>
        </div>

        {showSavings && (
          <Badge variant="success" className="self-start text-xs">
            {bundle.pricing?.savingsLabel ?? `Save ${formatCurrency(savings)}`}
          </Badge>
        )}

        {bundle.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{bundle.description}</p>
        )}

        {bundle.items && bundle.items.length > 0 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Hide' : 'Show'} {bundle.items.length} included item{bundle.items.length !== 1 ? 's' : ''}
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1">
                {bundle.items.map((bi) => (
                  <li key={bi.itemId} className="flex justify-between text-xs text-muted-foreground">
                    <span className="line-clamp-1">
                      {bi.quantity > 1 && <span className="font-medium mr-1">{bi.quantity}×</span>}
                      {bi.title}
                    </span>
                    <span className="shrink-0 ml-2">{formatCurrency(bi.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          {unavailable && <Badge variant="destructive">Unavailable</Badge>}
          <Button
            variant="primary"
            size="small"
            onClick={handleAddToCart}
            disabled={!!unavailable || addBundleToCart.isPending}
            className="ml-auto shrink-0"
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            {addBundleToCart.isPending ? 'Adding…' : 'Add Bundle'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
