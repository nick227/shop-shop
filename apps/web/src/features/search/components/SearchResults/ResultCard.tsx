/**
 * ResultCard - Polymorphic card renderer for search results
 * Renders appropriate card based on result type and variant
 */
import { memo } from 'react'
import { StoreCardStandard, StoreCardCompact, StoreCardExpanded } from '@features/stores/components/StoreCard'
import { ProductCard } from '@features/products/components/ProductCard'
import type { SearchResult, StoreSearchResult, ProductSearchResult } from '../../types/search.types'
import type { StoreClickHandler, ProductClickHandler } from '@api/backend-types'
import { transformStoreResult, transformProductResult } from '../../utils/searchTransformers'

export type CardVariant = 'compact' | 'standard' | 'expanded'

export interface ResultCardProps {
  result: SearchResult
  variant?: CardVariant | undefined
  onStoreClick?: StoreClickHandler | undefined
  onProductClick?: ProductClickHandler | undefined
}

function ResultCardComponent({
  result,
  variant = 'standard',
  onStoreClick,
  onProductClick
}: ResultCardProps) {
  // Render based on result type
  switch (result.type) {
    case 'store': {
      return renderStoreCard(result, variant, onStoreClick)
    }
    case 'product': {
      return renderProductCard(result, variant, onProductClick)
    }
    default: {
      return
    }
  }
}

/**
 * Render store card with appropriate variant
 */
function renderStoreCard(
  store: StoreSearchResult,
  variant: CardVariant,
  onClick?: StoreClickHandler
) {
  const storeData = transformStoreResult(store)
  
  switch (variant) {
    case 'compact': {
      return <StoreCardCompact store={storeData} onClick={onClick} />
    }
    case 'expanded': {
      return <StoreCardExpanded store={storeData} onViewMenu={onClick} />
    }
    default: {
      return <StoreCardStandard store={storeData} onClick={onClick} />
    }
  }
}

/**
 * Render product card with appropriate variant
 */
function renderProductCard(
  product: ProductSearchResult,
  variant: CardVariant,
  onClick?: ProductClickHandler
) {
  const productData = transformProductResult(product)
  
  return (
    <ProductCard
      product={productData}
      onClick={onClick}
      variant={variant === 'compact' ? 'compact' : 'standard'}
    />
  )
}

export const ResultCard = memo(ResultCardComponent)

