/**
 * SearchResults - Flexible container for displaying search results
 * Optimized version with extracted helpers and components
 */
import { memo, useMemo } from 'react'
import { Carousel } from '@shared/ui/primitives'
import { groupAndTransformResults } from '@features/search/utils/searchOptimizations'
import { ResultCard, type CardVariant } from './ResultCard'
import { StoreCardStandard, StoreCardCompact, StoreCardExpanded } from '@features/stores/components/StoreCard'
import { ProductCard } from '@features/products/components/ProductCard'
import type { SearchResult } from '@shared/types'
import type { StoreClickHandler, ProductClickHandler } from '@api/types'

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
      <div className="max-w-7xl mx-auto text-center py-12 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-4">
        <p>No results found. Try adjusting your search or filters.</p>
      </div>
    )
  }

  // Grid Layout
  if (layout === 'grid') {
    return (
      <div className={` ${className || ''}`}>
        {groupByType ? (
          <>
            {transformedStores.length > 0 && (
              <section className="max-w-7xl mx-auto mb-10">
                <h2 className="text-xl font-bold flex items-center gap-2">Restaurants</h2>
                <div className="">
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
              <section className="max-w-7xl mx-auto mb-10">
                <h2 className="text-xl font-bold flex items-center gap-2">Products</h2>
                <div className="">
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
          <div className="">
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
      <div className={` ${className || ''}`}>
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
    <div className={` ${className || ''}`}>
      {transformedStores.length > 0 && (
        <section className="max-w-7xl mx-auto mb-10">
          <h2 className="text-xl font-bold flex items-center gap-2">Restaurants</h2>
          <div className="">
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
        <section className="max-w-7xl mx-auto mb-10">
          <Carousel
            variant="horizontal"
            title="Products"
            subtitle={'' + transformedProducts.length + ' items found'}
            showControls
          >
            {transformedProducts.map(product => (
              <div key={product.id} className="group rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
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

