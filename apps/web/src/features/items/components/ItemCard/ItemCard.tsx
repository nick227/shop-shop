/**
 * ItemCard - Display menu item with SEO-friendly URLs;
 */
import { Link } from 'react-router-dom'
import { Card, Badge, Button, Image } from '../../../../components/ui'
import { useAddToCart } from '../../../../hooks/useAddToCart'
import { getItemRouteSimple } from '../../../../utils/navigation/routes'
import type { ItemResponse } from '../../../../api/backend-types'
import { formatCurrency } from '../../../../utils/format'
import { parsePrice } from '../../../../utils/format'
// import { styles } from '../../../../utils/tailwind-classes' // File not found

export interface ItemCardProps {
  item: ItemResponse;
  /** Optional store context for better SEO URLs */
  store?: { id: string; name: string }
}

export function ItemCard({ item, store }: ItemCardProps) {
  const price = parsePrice(item.price)
  const addToCart = useAddToCart()
  
  const imageUrl = (item as any).imageUrl;
  // Generate SEO-friendly item route;
  const itemRoute = getItemRouteSimple({ id: item.id, title: item.title })

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    addToCart.mutate({
      storeId: item.storeId,
      itemId: item.id,
      quantity: 1})
  }

  return (
    <Card className="item-card">
      <Image
        src={imageUrl || '/placeholder-item-' + item.id + '.jpg'}
        alt={item.title}
        fallbackSeed={item.id}
        aspectRatio="4/3"
        containerClassName="item-card__image"
      />
      <div className="item-card__content">
        <div className="item-card__header">
          <Link to={itemRoute} className="item-card__title-link">
            <h4 className="item-card__title">{item.title}</h4>
          </Link>
          <span className="item-card__price">{formatCurrency(price)}</span>
        </div>

        {item.description && (
          <p className="item-card__description">{item.description}</p>
        )}

        <div className="item-card__footer">
          <div className="item-card__badges">
            {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
            {!item.isActive && <Badge variant="warning">Inactive</Badge>}
          </div>
          
          <Button
            variant="primary"
            size="small"
            onClick={handleAddToCart}
            disabled={item.isSoldOut || !item.isActive || addToCart.isPending}
            className="item-card__add-button"
          >
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

