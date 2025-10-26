/**
 * ItemCard - Display menu item with SEO-friendly URLs;
 */
import { Link } from 'react-router-dom'
import { Card, Badge, Button, Image } from '@ui'
import { useAddToCart } from '@hooks/useAddToCart'
import { getItemRouteSimple } from '@utils/navigation/routes'
import type { Item } from '@api/types'
import { formatCurrency } from '@utils/format'
import { parsePrice } from '@api/types'
import { styles } from '@utils/tailwind-classes'

export interface ItemCardProps {
  item: Item;
  /** Optional store context for better SEO URLs */
  store?: { id: string; name: string }
}

export function ItemCard({ item, store }: ItemCardProps) {
  const price = parsePrice(item.price)
  const addToCart = useAddToCart()
  
  // @ts-expect-error - imageUrl will be added to Item type when backend supports it;
  const imageUrl = item.imageUrl;
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
    <Card className={styles['itemCard']}>
      <Image
        src={imageUrl || '/placeholder-item-' + item.id + '.jpg'}
        alt={item.title}
        fallbackSeed={item.id}
        aspectRatio="4/3"
        containerClassName={styles['image']}
      />
      <div className={styles['content']}>
        <div className={styles['header']}>
          <Link to={itemRoute} className={styles['titleLink']}>
            <h4 className={styles['title']}>{item.title}</h4>
          </Link>
          <span className={styles['price']}>{formatCurrency(price)}</span>
        </div>

        {item.description && (
          <p className={styles['description']}>{item.description}</p>
        )}

        <div className={styles['footer']}>
          <div className={styles['badges']}>
            {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
            {!item.isActive && <Badge variant="warning">Inactive</Badge>}
          </div>
          
          <Button
            variant="primary"
            size="small"
            onClick={handleAddToCart}
            disabled={item.isSoldOut || !item.isActive || addToCart.isPending}
            className={styles['addButton']}
          >
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

