/**
 * ItemCard - Display menu item with SEO-friendly URLs;
 */
import { Link } from 'react-router-dom'
import { Card, Badge, Button, Image } from '@shared/ui/primitives'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { ItemResponse } from '@api/types'
import { formatCurrency } from '@shared/lib/utils/format'
import { parsePrice } from '@shared/lib/utils/format'
//  // File not found

export interface ItemCardProps {
  item: ItemResponse;
  /** Optional store context for better SEO URLs */
  store?: { id: string; name: string }
}

export function ItemCard({ item, store }: ItemCardProps) {
  const price = parsePrice(item.price)
  const addToCart = useAddToCart()
  
  // Fetch item media for thumbnail
  const { data: itemMedia } = useQuery({
    queryKey: ['item-media', item.id],
    queryFn: async () => {
      const response = await fetch(`/media?itemId=${item.id}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch item media')
      }
      const data = await response.json()
      return data.data || []
    },
    enabled: !!item.id,
  })

  const primaryMedia = itemMedia?.[0] // First media item is primary
  const thumbnailUrl = primaryMedia?.url

  // Generate SEO-friendly item route;
  const itemRoute = getItemRouteSimple({ id: item.id, title: item.title })

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    addToCart.mutate({
      storeId: item.storeId,
      itemId: item.id,
      quantity: 1,
      title: item.title,
      unitPrice: item.price,
      item})
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card transition-colors hover:border-primary/40">
      <Image
        src={thumbnailUrl || '/placeholder-item-' + item.id + '.jpg'}
        alt={item.title}
        fallbackSeed={item.id}
        aspectRatio="4/3"
        containerClassName="aspect-[4/3] w-full bg-muted"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link to={itemRoute} className="min-w-0 hover:underline">
            <h4 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">{item.title}</h4>
          </Link>
          <span className="shrink-0 text-sm font-bold text-foreground">{formatCurrency(price)}</span>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
            {!item.isActive && <Badge variant="warning">Inactive</Badge>}
          </div>
          
          <Button
            variant="primary"
            size="small"
            onClick={handleAddToCart}
            disabled={item.isSoldOut || !item.isActive || addToCart.isPending}
            className="shrink-0"
          >
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

