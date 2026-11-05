/**
 * ItemSheet - an item's details over the storefront: photos, description, quantity and add to cart.
 * A bottom sheet on phones, a centered panel on wider screens; the menu stays where the shopper left it.
 */
import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { ItemResponse } from '@api/types'
import { Button } from '@shared/ui/primitives'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@shared/ui/primitives/ui/Dialog'
import { cn } from '@shared/lib/cn'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { canOrderItem, useStorefrontActions } from '../context'
import { itemImage } from './ProductTile'

const MAX_QUANTITY = 50

export function ItemSheet({ item, onClose }: { readonly item: ItemResponse | null; readonly onClose: () => void }) {
  const { addItem, acceptingOrders, theme } = useStorefrontActions()
  const [quantity, setQuantity] = useState(1)
  useEffect(() => setQuantity(1), [item?.id])

  const photos = item
    ? [...new Set([itemImage(item), ...(item.mediaAssets ?? []).filter((m) => m.kind !== 'VIDEO').map((m) => m.url)])].filter(
        (url): url is string => typeof url === 'string' && url.length > 0,
      )
    : []
  const unit = item ? parsePrice(item.price) : 0
  const orderable = item ? canOrderItem(item) : false
  const dietary = (item?.tags ?? []).filter((tag) => tag.category === 'DIETARY' || tag.category === 'DIET').map((tag) => tag.label)

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={theme.style}
        className={cn(
          theme.className,
          'bottom-0 top-auto max-h-[92vh] max-w-lg translate-y-0 gap-0 overflow-y-auto rounded-t-2xl p-0',
          'sm:bottom-auto sm:top-[50%] sm:translate-y-[-50%] sm:rounded-2xl',
        )}
      >
        {item ? (
          <>
            {photos.length > 0 ? (
              <div className="sf-row" style={{ gridAutoColumns: '100%' }}>
                {photos.map((url) => (
                  <img key={url} src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                ))}
              </div>
            ) : null}
            <div className="space-y-4 p-5">
              <div className="space-y-1 pr-6">
                <DialogTitle className="sf-heading text-2xl font-semibold leading-tight">{item.title}</DialogTitle>
                <p className="text-base font-semibold">{formatCurrency(unit)}</p>
              </div>
              {item.description ? (
                <DialogDescription className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{item.title}</DialogDescription>
              )}
              {dietary.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5" aria-label="Dietary">
                  {dietary.map((label) => (
                    <li key={label} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {label}
                    </li>
                  ))}
                </ul>
              ) : null}

              <OrderNote orderable={orderable} acceptingOrders={acceptingOrders} />

              <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-border bg-background px-5 py-3">
                <QuantityStepper value={quantity} onChange={setQuantity} />
                <Button
                  variant="primary"
                  className="flex-1 rounded-full"
                  disabled={!orderable}
                  onClick={() => {
                    addItem(item, quantity)
                    onClose()
                  }}
                >
                  Add {quantity > 1 ? `${quantity} ` : ''}to cart · {formatCurrency(unit * quantity)}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function OrderNote({ orderable, acceptingOrders }: { readonly orderable: boolean; readonly acceptingOrders: boolean }) {
  if (!orderable) return <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Sold out right now.</p>
  if (acceptingOrders) return null
  return (
    <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      This store isn’t taking orders right now. You can still add this for later.
    </p>
  )
}

function QuantityStepper({ value, onChange }: { readonly value: number; readonly onChange: (next: number) => void }) {
  return (
    <div className="flex items-center rounded-full border border-border" role="group" aria-label="Quantity">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="One fewer"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
        onClick={() => onChange(Math.min(MAX_QUANTITY, value + 1))}
        disabled={value >= MAX_QUANTITY}
        aria-label="One more"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
