/**
 * ProductTile - one item on the storefront, in the shape its surroundings call for:
 * `card` (photo on top), `row` (text left, photo right, like delivery apps) or `hero` (large photo with
 * the name over it). The whole tile opens the item; the round button adds one to the cart.
 */
import { Plus } from 'lucide-react'
import type { ItemResponse } from '@api/types'
import { Image } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { getImageUrl } from '@shared/lib/utils/image'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { canOrderItem, useStorefrontActions } from '../context'

export type ProductTileVariant = 'card' | 'row' | 'hero'

export function itemImage(item: ItemResponse): string | undefined {
  const extra = item as ItemResponse & { imageUrl?: string | null }
  const hasOwn = Boolean(extra.imageUrl) || (item.mediaAssets?.length ?? 0) > 0
  return hasOwn ? getImageUrl(extra.imageUrl ?? undefined, item.id, 'item', item.mediaAssets) : undefined
}

export function ProductTile({ item, variant = 'card', className }: {
  readonly item: ItemResponse
  readonly variant?: ProductTileVariant
  readonly className?: string
}) {
  const { openItem, addItem } = useStorefrontActions()
  const image = itemImage(item)
  const price = formatCurrency(parsePrice(item.price))
  const orderable = canOrderItem(item)

  const open = (
    <button
      type="button"
      onClick={() => openItem(item)}
      className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${item.title}, ${price}${orderable ? '' : ', sold out'}`}
    />
  )
  const add = (
    <button
      type="button"
      onClick={() => addItem(item)}
      disabled={!orderable}
      aria-label={orderable ? `Add ${item.title} to cart` : `${item.title} is sold out`}
      className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-foreground"
    >
      <Plus className="h-4 w-4" aria-hidden />
    </button>
  )
  const soldOut = orderable ? null : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Sold out</span>
  )

  if (variant === 'hero') {
    return (
      <article className={cn('relative h-full min-h-[16rem] overflow-hidden rounded-2xl bg-muted', className)}>
        {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden />
        {open}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
          <div className="min-w-0">
            <p className="sf-heading text-xl font-semibold leading-tight line-clamp-2">{item.title}</p>
            <p className="mt-1 text-sm font-medium opacity-90">{price}</p>
            {soldOut}
          </div>
          <div className="pointer-events-auto">{add}</div>
        </div>
      </article>
    )
  }

  if (variant === 'row') {
    // Compact delivery-app row: text, small thumb, add.
    return (
      <article
        className={cn(
          'relative flex items-center gap-2.5 rounded-md border border-border/80 bg-card px-2.5 py-1.5 transition-colors hover:border-primary/40',
          image ? 'min-h-[3.25rem]' : 'min-h-[2.75rem]',
          className,
        )}
      >
        {open}
        <div className="pointer-events-none relative min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium leading-tight text-foreground">{item.title}</h3>
          {item.description ? <p className="truncate text-[0.7rem] leading-tight text-muted-foreground">{item.description}</p> : null}
          {image ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold tabular-nums text-foreground">
              {price}
              {soldOut}
            </p>
          ) : null}
        </div>
        {image ? (
          <img src={image} alt="" loading="lazy" className="pointer-events-none relative h-11 w-11 shrink-0 rounded object-cover" />
        ) : (
          <div className="pointer-events-none relative flex shrink-0 items-center gap-1.5">
            {soldOut}
            <span className="text-sm font-semibold tabular-nums text-foreground">{price}</span>
          </div>
        )}
        <div className="relative">{add}</div>
      </article>
    )
  }

  return (
    <article className={cn('relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40', className)}>
      {open}
      <div className="pointer-events-none relative">
        <Image
          src={image ?? ''}
          alt=""
          fallbackSeed={item.id}
          aspectRatio="4/3"
          containerClassName="aspect-[4/3] w-full bg-muted"
        />
        <div className="pointer-events-auto absolute bottom-1.5 right-1.5">{add}</div>
      </div>
      <div className="pointer-events-none relative flex flex-1 flex-col gap-0.5 p-2">
        <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{item.title}</h3>
        <div className="mt-auto flex items-center gap-2 pt-0.5">
          <span className="text-xs font-semibold text-foreground">{price}</span>
          {soldOut}
        </div>
      </div>
    </article>
  )
}
