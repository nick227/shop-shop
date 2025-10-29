/**
 * ProductCard - Display product information for carousels and grids
 * Designed for search results and featured product sections
 */
import { memo, useCallback, useMemo } from 'react'
import { Card, Image } from '@shared/ui/primitives'
import { ICON, ASPECT_RATIO, LABEL } from '@shared/ui/primitives/Carousel/constants'
import { getImageUrl } from '@shared/lib/image'
import type { ProductClickHandler, ItemResponse } from '@api/backend-types'
import { styles } from '@shared/lib/tailwind-classes'

export interface ProductCardProps {
  product: ItemResponse
  onClick?: ProductClickHandler | undefined
  variant?: 'standard' | 'compact' | undefined
  showStore?: boolean | undefined
}

const PRICE_DECIMALS = 2

function ProductCardComponent({ 
  product, 
  onClick,
  variant = 'standard',
  showStore = true
}: ProductCardProps) {
  const handleClick = useCallback(() => onClick?.(product), [onClick, product])
  
  const isCompact = variant === 'compact'
  const imageUrl = useMemo(
    () => getImageUrl(undefined, product.id, 'product'),
    [product.id]
  )
  const aspectRatio = isCompact ? ASPECT_RATIO.SQUARE : ASPECT_RATIO.LANDSCAPE
  const formattedPrice = useMemo(
    () => '$' + Number.parseFloat(product.price).toFixed(PRICE_DECIMALS) + '',
    [product.price]
  )

  return (
    <Card 
      onClick={handleClick} 
      className={`${styles.card} ${isCompact ? styles.compact : ''}`}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={imageUrl}
          alt={product.title}
          fallbackSeed={product.id}
          aspectRatio={aspectRatio}
          containerClassName={styles.image}
        />
        {!product.isActive && (
          <div className={styles.unavailableBadge}>
            {LABEL.SOLD_OUT}
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.name}>{product.title}</h4>
          <span className={styles.price}>
            {formattedPrice}
          </span>
        </div>
        
        {!isCompact && product.description && (
          <p className={styles.description}>{product.description}</p>
        )}
        
        {showStore && (
          <div className={styles.storeName}>
            <span className={styles.storeIcon}>{ICON.STORE}</span>
            Store ID: {product.storeId}
          </div>
        )}
      </div>
    </Card>
  )
}

export const ProductCard = memo(ProductCardComponent)

