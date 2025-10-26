/**
 * Modular Widgets Example Page
 * Demonstrates all store/product card variants and carousel layouts
 * Shows search/filter integration across all widgets
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carousel } from '@ui'
import { StoreCardCompact, StoreCardStandard, StoreCardExpanded } from '@features/stores/components/StoreCard'
import { ProductCard } from '@features/products/components/ProductCard'
import { useStores } from '@hooks/generated'
// TODO: Implement useFilteredContent hook
// import { useFilteredStores, useFilteredProducts, getFeaturedItems, type SearchFilters } from '@hooks/useFilteredContent'
interface SearchFilters { query?: string; category?: string }
import type { LocationData } from '@/types/location.types'
import { styles } from '@utils/tailwind-classes'

// Mock products for demonstration
const mockProducts = [
  { id: '1', name: 'Margherita Pizza', description: 'Fresh mozzarella, basil, tomato', price: 12.99, storeId: '1', storeName: 'Pizza Palace', category: 'Italian', available: true },
  { id: '2', name: 'Cheeseburger', description: 'Angus beef, cheddar, lettuce', price: 9.99, storeId: '2', storeName: 'Burger Joint', category: 'American', available: true },
  { id: '3', name: 'Pad Thai', description: 'Rice noodles, peanuts, lime', price: 11.5, storeId: '3', storeName: 'Thai Express', category: 'Thai', available: true },
  { id: '4', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 8.99, storeId: '1', storeName: 'Pizza Palace', category: 'Salads', available: true },
  { id: '5', name: 'Sushi Roll', description: 'Fresh salmon, avocado, cucumber', price: 14.99, storeId: '4', storeName: 'Sushi Bar', category: 'Japanese', available: false },
]

export default function ModularWidgetsExample() {
  const navigate = useNavigate()
  const [location] = useState<LocationData>({
    latitude: 30.2672,
    longitude: -97.7431,
    radiusMiles: 25,
    source: 'manual',
    displayName: 'Austin, TX'
  })

  const [filters] = useState<SearchFilters>({
    query: '',
    category: ''
  })

  // Get stores with filtering
  const { data: stores } = useStores({
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMiles: location.radiusMiles
  })
  // Simple filtering (TODO: Implement useFilteredContent hook)
  const filteredStores = { items: stores || [], total: (stores || []).length }
  const filteredProducts = { items: mockProducts, total: mockProducts.length }

  // Get featured items
  const featuredStores = (stores || []).slice(0, 6)
  const nearbyStores = (stores || []).slice(0, 10)
  const popularProducts = mockProducts.slice(0, 8)

  const handleStoreClick = (store: import('@api/types').StoreResponse | import('@api/types').StoreWithDistance) => {
    navigate('/stores/' + store.id + '')
  }

  const handleProductClick = (item: import('@api/types').ItemResponse) => {
    console.log('Product clicked:', item?.id)
  }

  return (
    <div className={styles['page']}>
      <header className={styles['header']}>
        <h1>Modular Widget System</h1>
        <p>Demonstrates all card variants and carousel layouts with search integration</p>
      </header>

      <main className={styles['main']}>
        {/* Section 1: Featured Section with Expanded Cards */}
        <section className={styles['section']}>
          <Carousel
            variant="horizontal"
            title="🌟 Featured Restaurants"
            subtitle="Hand-picked favorites in your area"
            showControls
          >
            {featuredStores.map((store: any) => (
              <div key={store.id} className={styles['expandedCard']}>
                <StoreCardExpanded
                  store={store}
                  onViewMenu={handleStoreClick}
                  featured
                  showActions
                />
              </div>
            ))}
          </Carousel>
        </section>

        {/* Section 2: Quick Browse with Compact Cards */}
        <section className={styles['section']}>
          <Carousel
            variant="compact"
            title="🍽️ Nearby Restaurants"
            subtitle="Quick browse of stores near you"
            showControls
          >
            {nearbyStores.map((store: any) => (
              <StoreCardCompact
                key={store.id}
                store={store}
                onClick={handleStoreClick}
                showDistance
                showMeta
              />
            ))}
          </Carousel>
        </section>

        {/* Section 3: Grid with Standard Cards */}
        <section className={styles['section']}>
          <h2 className={styles['sectionTitle']}>📍 All Restaurants</h2>
          <p className={styles['sectionSubtitle']}>
            Showing {filteredStores.total} restaurant{filteredStores.total === 1 ? '' : 's'}
          </p>
          <div className={styles['grid']}>
            {filteredStores.items.slice(0, 6).map((store: any) => (
              <StoreCardStandard
                key={store.id}
                store={store}
                onClick={handleStoreClick}
              />
            ))}
          </div>
        </section>

        {/* Section 4: Product Carousel */}
        <section className={styles['section']}>
          <Carousel
            variant="horizontal"
            title="🔥 Popular Items"
            subtitle="Best sellers from top restaurants"
            showControls
          >
            {popularProducts.map((product: any) => (
              <div key={product.id} className={styles['productCard']}>
                <ProductCard
                  product={product}
                  onClick={handleProductClick}
                  variant="standard" />
              </div>
            ))}
          </Carousel>
        </section>

        {/* Section 5: Sidebar Layout with Vertical Carousel */}
        <section className={styles['section']}>
          <div className={styles['sidebarLayout']}>
            <div className={styles['mainContent']}>
              <h2>Main Content Area</h2>
              <p>This demonstrates how a vertical carousel can work as a sidebar.</p>
              <p>The main content flows here while quick access items appear on the right.</p>
            </div>

            <aside className={styles['sidebar']}>
              <Carousel
                variant="vertical"
                title="Popular Now"
                subtitle="Trending"
                showControls
              >
                {nearbyStores.slice(0, 8).map((store) => (
                  <StoreCardCompact
                    key={store.id}
                    store={store}
                    onClick={handleStoreClick}
                    showDistance
                  />
                ))}
              </Carousel>
            </aside>
          </div>
        </section>

        {/* Section 6: Compact Product Grid */}
        <section className={styles['section']}>
          <Carousel
            variant="compact"
            title="⚡ Quick Picks"
            subtitle="Fast food favorites"
            showControls
          >
            {popularProducts.map((product: any) => (
              <div key={product.id} className={styles['compactProduct']}>
                <ProductCard
                  product={product}
                  onClick={handleProductClick}
                  variant="compact"
                  showStore={false}
                />
              </div>
            ))}
          </Carousel>
        </section>
      </main>
    </div>
  )
}

