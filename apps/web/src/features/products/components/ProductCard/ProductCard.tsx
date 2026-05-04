/**
 * ProductCard - Display product information for carousels and grids
 * Designed for search results and featured product sections
 */
import { memo, useCallback, useMemo } from 'react'
import { Card, Image, ICON, ASPECT_RATIO, LABEL } from '@shared/ui/primitives'
import { getImageUrl } from '@shared/lib/utils/image'
import type { ProductClickHandler, ItemResponse } from '@api/types'

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
      className={`bg-card rounded-xl border shadow-sm p-4 ${isCompact ? 'max-w-[260px]' : ''}`}
    >
      <div className="">
        <Image
          src={imageUrl}
          alt={product.title}
          fallbackSeed={product.id}
          aspectRatio={aspectRatio}
          containerClassName="w-full rounded-md overflow-hidden"
        />
        {!product.isActive && (
          <div className="">
            {LABEL.SOLD_OUT}
          </div>
        )}
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="max-w-7xl mx-auto mb-6 flex justify-between items-start gap-4">
          <h4 className="">{product.title}</h4>
          <span className="font-bold text-primary">
            {formattedPrice}
          </span>
        </div>
        
        {!isCompact && product.description && (
          <p className="">{product.description}</p>
        )}
        
        {showStore && (
          <div className="text-xl font-semibold mb-1">
            <span className="">{ICON.STORE}</span>
            Store ID: {product.storeId}
          </div>
        )}
      </div>
    </Card>
  )
}

export const ProductCard = memo(ProductCardComponent)

