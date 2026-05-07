/**
 * ItemCard - Display menu item with SEO-friendly URLs;
 */
import { Link } from 'react-router-dom'
import { Card, Badge, Button, Image } from '@shared/ui/primitives'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { getImageUrl } from '@shared/lib/utils/image'
import type { ItemResponse } from '@api/types'
import { formatCurrency } from '@shared/lib/utils/format'
import { parsePrice } from '@shared/lib/utils/format'
import { ShoppingCart } from 'lucide-react'

export interface ItemCardProps {
  item: ItemResponse;
  /** Optional store context for better SEO URLs */
  store?: { id: string; name: string }
}
  
export function ItemCard({ item }: Readonly<ItemCardProps>) {
  const price = parsePrice(item.price)
  const addToCart = useAddToCart()
  
  // Use mediaAssets from item data (now included in backend queries)
  const thumbnailUrl = getImageUrl(
    (item as any).imageUrl, 
    item.id, 
    'item', 
    (item as any).mediaAssets
  )

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
    <Card className="flex overflow-hidden relative flex-col h-full transition-colors border-border bg-card hover:border-primary/40">
      
          
      <Link to={itemRoute} className="min-w-0 hover:underline">
      <Image
        src={thumbnailUrl}
        alt={item.title}
        fallbackSeed={item.id}
        aspectRatio="4/3"
        containerClassName="aspect-[4/3] w-full bg-muted"
      />
        </Link>
      <div className="flex flex-col flex-1 gap-0 p-0">
        <div className="min-h-12">    
        <Link to={itemRoute} className="min-w-0 hover:underline">
          <h4 className="text-base font-semibold tracking-tight line-clamp-2 text-foreground">{item.title}</h4>
          </Link>
          <span className="text-sm font-bold shrink-0 text-foreground">{formatCurrency(price)}</span>
        </div>

        
        {item.description && (
          <p className="text-sm line-clamp-2 text-muted-foreground min-h-12">{item.description}</p>
        )}

        <div className="flex justify-between items-center mt-0">
          <div className="flex flex-wrap gap-2">
            {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
            {!item.isActive && <Badge variant="warning">Inactive</Badge>}
          </div>
          
        </div>
      </div>
    </Card>
  )
}

