/**
 * Carousel Examples - Demonstrates all carousel variants with stores and products
 * Shows how to integrate with search/filter system
 */
import { Carousel } from '@ui'
import { StoreCardCompact, StoreCardExpanded } from '../StoreCard'
import { ProductCard } from '@features/products/components/ProductCard'
import type { Store, StoreClickHandler, ProductClickHandler, ItemResponse } from '@api/types'

interface ExampleProps {
  stores: (Store & { distance?: number })[]
  products: ItemResponse[]
  onStoreClick: StoreClickHandler
  onProductClick: ProductClickHandler
}

export function CarouselExamples({ stores, products, onStoreClick, onProductClick }: ExampleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {/* 1. Compact Horizontal - Quick Store Browse */}
      <Carousel
        variant="compact"
        title="Nearby Restaurants"
        subtitle="Quick browse of stores near you"
        showControls
      >
        {stores.slice(0, 8).map((store) => (
          <StoreCardCompact
            key={store.id}
            store={store}
            onClick={onStoreClick}
            showDistance
            showMeta
          />
        ))}
      </Carousel>

      {/* 2. Horizontal Standard - Featured Stores */}
      <Carousel
        variant="horizontal"
        title="Featured Restaurants"
        subtitle="Hand-picked favorites from your area"
        showControls
      >
        {stores.slice(0, 6).map((store) => (
          <div key={store.id} style={{ minWidth: '380px', maxWidth: '380px' }}>
            <StoreCardExpanded
              store={store}
              onViewMenu={onStoreClick}
              featured
              showActions
            />
          </div>
        ))}
      </Carousel>

      {/* 3. Vertical Sidebar - Quick Access */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-8)' }}>
        <div>
          <h2>Main Content Area</h2>
          <p>Your main content goes here...</p>
        </div>

        <Carousel
          variant="vertical"
          title="Popular Now"
          subtitle="Trending in your area"
          showControls
        >
          {stores.slice(0, 10).map((store) => (
            <StoreCardCompact
              key={store.id}
              store={store}
              onClick={onStoreClick}
              showDistance
            />
          ))}
        </Carousel>
      </div>

      {/* 4. Product Carousel - Search Results */}
      <Carousel
        variant="horizontal"
        title="Products Matching Your Search"
        subtitle="From multiple restaurants"
        showControls
      >
        {products.map((product) => (
          <div key={product.id} style={{ minWidth: '280px', maxWidth: '280px' }}>
            <ProductCard
              product={product}
              onClick={onProductClick}
              variant="standard"
              showStore
            />
          </div>
        ))}
      </Carousel>

      {/* 5. Compact Product Grid - Quick Browse */}
      <Carousel
        variant="compact"
        title="Popular Items"
        subtitle="Best sellers across all restaurants"
        showControls
      >
        {products.slice(0, 12).map((product) => (
          <div key={product.id} style={{ minWidth: '200px', maxWidth: '200px' }}>
            <ProductCard
              product={product}
              onClick={onProductClick}
              variant="compact"
              showStore={false}
            />
          </div>
        ))}
      </Carousel>
    </div>
  )
}

