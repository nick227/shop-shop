/**
 * StoreDetailPage - Store menu and details
 */
import { useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@hooks/generated'
import { useItems } from '@hooks/generated'
import { useBundles } from '@hooks/generated'
import { StoreHeader } from '../../features/stores/components/StoreHeader'
import { StoreMapLazy } from '../../features/stores/components/StoreMapLazy'
import { ItemCard, ItemCarouselCompact } from '../../features/items/components'
import { BundleGrid } from '../../features/bundles/components/customer'
// import { RiverFeed } from '../../features/river' // Disabled until Posts API is available
import { Button, Spinner, DataState } from '@ui'
import type { StoreWithDistance } from '@api/types'
import { styles } from '@utils/tailwind-classes'

// Stable no-op function reference (avoids re-renders)
const NOOP = (): void => {
  // Intentionally empty
}

export default function StoreDetailPage() {
  // Get storeId from URL parameters (matches router.tsx :storeId)
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [showCarousel, setShowCarousel] = useState(false)
  const [activeTab, setActiveTab] = useState<'menu' | 'river'>('menu')
  
  const { data: store, isLoading: storeLoading, error: storeError } = useStore(storeId ?? '')
  const { data: items, isLoading: itemsLoading, error: itemsError } = useItems(storeId ? { storeId } : undefined)
  // Posts API not available in SDK yet
  const posts: any[] = []
  const postsLoading = false
  const postsError = null
  const { data: bundles = [] } = useBundles(storeId ? { storeId, isActive: true } : undefined)
  // useTogglePostLike removed - Posts API not available

  // Memoize store array for map (must be before early returns per React hooks rules)
  const storeForMap = useMemo<StoreWithDistance[]>(() => {
    if (!store) return []
    const hasLocation = store.latitude !== undefined && store.longitude !== undefined
    return hasLocation ? [store as StoreWithDistance] : []
  }, [store])

  const handleBack = () => {
    navigate('/')
  }

  // Posts functionality disabled until API is available
  const handleLike = useCallback((postId: string) => {
    // No-op until Posts API is available
  }, [])

  if (storeLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <p>Loading store...</p>
      </div>
    )
  }

  if (storeError || !store) {
    return (
      <div className={styles.error}>
        <h2>Store Not Found</h2>
        <p>{storeError?.message ?? 'The store you are looking for does not exist.'}</p>
        <Button onClick={handleBack}>Back to Home</Button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <Button variant="ghost" onClick={handleBack}>
          ← Back
        </Button>
      </div>

      <StoreHeader store={store as any} />

      {/* Store Location Map */}
      {storeForMap.length > 0 && (
        <div className={styles.mapSection}>
          <StoreMapLazy 
            stores={storeForMap}
            height="400px"
          />
        </div>
      )}

      <main className={styles.content}>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            className={'px-6 py-3 font-medium transition-colors ' + 
              activeTab === 'menu'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
             + ''}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Menu
          </button>
          <button
            className={'px-6 py-3 font-medium transition-colors ' + 
              activeTab === 'river'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
             + ''}
            onClick={() => setActiveTab('river')}
          >
            📱 River
          </button>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <>
            <div className={styles.menuHeader}>
              <h2 className={styles.sectionTitle}>Menu</h2>
              {items && items.length > 0 && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowCarousel(true)}
                >
                  📱 View Carousel
                </Button>
              )}
            </div>

            {/* Bundles Section */}
            {bundles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Bundle Deals</h3>
                <BundleGrid
                  bundles={bundles as any}
                  columns={3}
                  showSavings={true}
                  compact={false}
                />
              </div>
            )}

            <DataState
              data={items}
              isLoading={itemsLoading}
              error={itemsError || undefined}
              emptyMessage="No menu items available"
            >
              {(items) => (
                <>
                  <div className={styles.grid}>
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                  
                  {showCarousel && (
                    <ItemCarouselCompact
                      items={items}
                      storeName={store?.name || ''}
                      onClose={() => setShowCarousel(false)}
                    />
                  )}
                </>
              )}
            </DataState>
          </>
        )}

        {/* River Tab - Disabled until Posts API is available */}
        {activeTab === 'river' && (
          <div className="p-8 text-center text-gray-500">
            <p>River feed is temporarily disabled while we update the Posts API.</p>
          </div>
        )}
      </main>
    </div>
  )
}

