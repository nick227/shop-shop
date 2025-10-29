/**
 * SearchResults - Flexible container for displaying search results
 * Optimized version with extracted helpers and components
 */
import { memo, useMemo } from 'react'
import { Carousel } from '@shared/ui/primitives'
import { groupAndTransformResults } from '../../utils/searchOptimizations'
import { ResultCard, type CardVariant } from './ResultCard'
import { StoreCardStandard, StoreCardCompact, StoreCardExpanded } from '@features/stores/components/StoreCard'
import { ProductCard } from '@features/products/components/ProductCard'
import type { SearchResult } from '../../types/search.types'
import type { StoreClickHandler, ProductClickHandler } from '@api/backend-types'
import { styles } from '@shared/lib/tailwind-classes'

export type ResultsLayout = 'grid' | 'carousel' | 'mixed'

export interface SearchResultsProps {
  results: SearchResult[]
  layout?: ResultsLayout
  cardVariant?: CardVariant
  groupByType?: boolean
  onStoreClick?: StoreClickHandler
  onProductClick?: ProductClickHandler
  className?: string
}

function SearchResultsComponent({
  results,
  layout = 'grid',
  cardVariant = 'standard',
  groupByType = true,
  onStoreClick,
  onProductClick,
  className = ''
}: SearchResultsProps) {
  // Single-pass grouping AND transformation (O(n) instead of O(3n))
  const { stores: transformedStores, products: transformedProducts } = useMemo(() => 
    groupByType ? groupAndTransformResults(results) : { stores: [], products: [] },
    [results, groupByType]
  )

  // Early return for empty results (after hooks to follow Rules of Hooks)
  if (results.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No results found. Try adjusting your search or filters.</p>
      </div>
    )
  }

  // Grid Layout
  if (layout === 'grid') {
    return (
      <div className={`${styles.gridLayout} ${className || ''}`}>
        {groupByType ? (
          <>
            {transformedStores.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Restaurants</h2>
                <div className={styles.grid}>
                  {transformedStores.map(store => (
                    <StoreCardStandard
                      key={store.id}
                      store={store}
                      onClick={onStoreClick}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {transformedProducts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Products</h2>
                <div className={styles.grid}>
                  {transformedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={onProductClick}
                      variant={cardVariant === 'compact' ? 'compact' : 'standard'}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className={styles.grid}>
            {results.map(result => (
              <ResultCard
                key={result.id}
                result={result}
                variant={cardVariant}
                onStoreClick={onStoreClick}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Carousel Layout
  if (layout === 'carousel') {
    return (
      <div className={`${styles.carouselLayout} ${className || ''}`}>
        {groupByType ? (
          <>
            {transformedStores.length > 0 && (
              <Carousel
                variant={cardVariant === 'compact' ? 'compact' : 'horizontal'}
                title="Restaurants"
                showControls
              >
                {transformedStores.map(store => {
                  if (cardVariant === 'compact') {
                    return <StoreCardCompact key={store.id} store={store} onClick={onStoreClick} />
                  } else if (cardVariant === 'expanded') {
                    return <StoreCardExpanded key={store.id} store={store} onViewMenu={onStoreClick} />
                  }
                  return <StoreCardStandard key={store.id} store={store} onClick={onStoreClick} />
                })}
              </Carousel>
            )}
            
            {transformedProducts.length > 0 && (
              <Carousel
                variant={cardVariant === 'compact' ? 'compact' : 'horizontal'}
                title="Products"
                showControls
              >
                {transformedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={onProductClick}
                    variant={cardVariant === 'compact' ? 'compact' : 'standard'}
                  />
                ))}
              </Carousel>
            )}
          </>
        ) : (
          <Carousel variant="horizontal" title="Search Results" showControls>
            {results.map(result => (
              <ResultCard
                key={result.id}
                result={result}
                variant={cardVariant}
                onStoreClick={onStoreClick}
                onProductClick={onProductClick}
              />
            ))}
          </Carousel>
        )}
      </div>
    )
  }

  // Mixed Layout
  return (
    <div className={`${styles.mixedLayout} ${className || ''}`}>
      {transformedStores.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Restaurants</h2>
          <div className={styles.grid}>
            {transformedStores.map(store => (
              <StoreCardStandard
                key={store.id}
                store={store}
                onClick={onStoreClick}
              />
            ))}
          </div>
        </section>
      )}
      
      {transformedProducts.length > 0 && (
        <section className={styles.section}>
          <Carousel
            variant="horizontal"
            title="Products"
            subtitle={'' + transformedProducts.length + ' items found'}
            showControls
          >
            {transformedProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <ProductCard
                  product={product}
                  onClick={onProductClick}
                  variant="standard"
                />
              </div>
            ))}
          </Carousel>
        </section>
      )}
    </div>
  )
}

export const SearchResults = memo(SearchResultsComponent)

