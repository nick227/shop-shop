/**
 * ItemDetailPage - Display full item details
 * Supports SEO-friendly slug-based URLs:
 *   /items/:itemSlug
 *   /stores/:storeSlug/items/:itemSlug
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useItem } from '@hooks/generated'
import { useStore } from '@hooks/generated'
import { useAddToCart } from '@hooks/useAddToCart'
import { parseItemSlug, parseStoreSlug } from '@utils/slugify'
import { getStoreRoute } from '@utils/navigation/routes'
import { Button, Spinner, Badge } from '@ui'
import { formatCurrency } from '@utils/format'
import { parsePrice } from '@api/types'
import { styles } from '@utils/tailwind-classes'

export default function ItemDetailPage() {
  const { itemSlug, storeSlug } = useParams<{ itemSlug: string; storeSlug?: string }>()
  const navigate = useNavigate()
  
  // Extract IDs from slugs
  const { id: itemId } = parseItemSlug(itemSlug || '')
  const { id: storeIdFromSlug } = storeSlug ? parseStoreSlug(storeSlug) : { id: null }
  
  // Fallback to slug if no ID extracted (legacy support)
  const itemIdToUse = itemId || itemSlug
  const storeIdToUse = storeIdFromSlug || storeSlug
  
  const { data: item, isLoading, error } = useItem(itemIdToUse || '')
  const targetStoreId = storeIdToUse || item?.storeId
  const { data: store } = useStore(targetStoreId || '', { enabled: !!targetStoreId } as any)
  const addToCart = useAddToCart()

  const handleBack = () => {
    // Use store data to generate SEO-friendly route
    if (store) {
      const route = getStoreRoute({ id: store.id, name: store.name })
      navigate(route)
    } else if (targetStoreId) {
      // Fallback if store data not loaded
      navigate('/stores/' + targetStoreId + '')
    } else {
      navigate('/')
    }
  }

  const handleAddToCart = () => {
    if (!item) return
    
    addToCart.mutate({
      storeId: item.storeId,
      itemId: item.id,
      quantity: 1,
    })
  }

  if (isLoading) {
    return (
      <div className={styles['loading']}>
        <Spinner size="large" />
        <p>Loading item...</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className={styles['error']}>
        <h2>Item Not Found</h2>
        <p>{error?.message || 'The item you are looking for does not exist.'}</p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    )
  }

  const price = parsePrice(item.price)

  return (
    <div className={styles['container']}>
      <div className={styles['backButton']}>
        <Button variant="ghost" onClick={handleBack}>
          ← Back
        </Button>
      </div>

      <div className={styles['content']}>
        <div className={styles['header']}>
          <div className={styles['titleSection']}>
            <h1 className={styles['title']}>{item.title}</h1>
            <div className={styles['badges']}>
              {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
              {!item.isActive && <Badge variant="warning">Inactive</Badge>}
            </div>
          </div>
          <div className={styles['price']}>{formatCurrency(price)}</div>
        </div>

        {item.description && (
          <div className={styles['descriptionSection']}>
            <h2 className={styles['sectionTitle']}>Description</h2>
            <p className={styles['description']}>{item.description}</p>
          </div>
        )}

        {item.stockQty !== null && (
          <div className={styles['infoSection']}>
            <h2 className={styles['sectionTitle']}>Availability</h2>
            <p className={styles['infoText']}>
              {item.stockQty > 0 
                ? '' + item.stockQty + ' items in stock' 
                : 'Out of stock'}
            </p>
          </div>
        )}

        <div className={styles['actions']}>
          <Button 
            variant="primary" 
            size="large"
            onClick={handleAddToCart}
            disabled={item.isSoldOut || !item.isActive || addToCart.isPending}
          >
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}

