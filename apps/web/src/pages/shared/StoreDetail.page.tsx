/**
 * StoreDetailPage - Store menu and details
 * Composition: Uses unified page composition system for consistent layout
 */
import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@hooks/generated'
import { useItems } from '@hooks/generated'
import { useBundles } from '@hooks/generated'
import { useRiverPosts } from '@hooks/river'
import { StoreHeader } from '../../features/stores/components/StoreHeader'
import { StoreMapLazy } from '../../features/stores/components/StoreMapLazy'
import { ItemCard, ItemCarouselCompact } from '../../features/products/components'
import { BundleGrid } from '../../features/bundles/components/customer'
// import { RiverFeed } from '../../features/river' // Disabled until Posts API is available
import { Button, Spinner, DataState } from '@ui'
import type { StoreWithDistance } from '@api/types'
import { styles } from '@utils/tailwind-classes'
import { PageCompositionFactory, LayoutCompositionFactory, CardCompositionFactory } from '@components/composition'

export default function StoreDetailPage() {
  // Get storeId from URL parameters (matches router.tsx :storeId)
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [showCarousel, setShowCarousel] = useState(false)
  
  const { data: store, isLoading: storeLoading, error: storeError } = useStore(storeId ?? '')
  const { data: items, isLoading: itemsLoading, error: itemsError } = useItems(storeId ? { storeId } : undefined)
  const { data: bundles = [] } = useBundles(storeId ? { storeId, isActive: true } : undefined)
  const { data: riverPosts = [], isLoading: riverLoading, error: riverError } = useRiverPosts(storeId)

  // Memoize store array for map (must be before early returns per React hooks rules)
  const storeForMap = useMemo<StoreWithDistance[]>(() => {
    if (!store) return []
    // eslint-disable-next-line unicorn/no-null -- SDK types use null, not undefined
    const hasLocation = store.latitude != null && store.longitude != null
    return hasLocation ? [store as StoreWithDistance] : []
  }, [store])

  const handleBack = () => {
    navigate('/')
  }

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
    <PageCompositionFactory.App
      layout="sidebar"
      sections={['header', 'content']}
      responsive={true}
      accessibility={true}
      className={styles.container}
    >
      <LayoutCompositionFactory.Stack
        direction="column"
        gap="lg"
        responsive={true}
      >
        <LayoutCompositionFactory.Flex
          direction="row"
          alignment="start"
          justify="between"
          gap="md"
          responsive={true}
        >
          <Button variant="ghost" onClick={handleBack}>
            ← Back
          </Button>
        </LayoutCompositionFactory.Flex>

        <StoreHeader store={store} />

        {/* Store Location Map */}
        {storeForMap.length > 0 && (
          <div className={styles.mapSection}>
            <StoreMapLazy 
              stores={storeForMap}
              height="400px"
            />
          </div>
        )}

        <LayoutCompositionFactory.Stack
          direction="column"
          gap="lg"
          responsive={true}
          className={styles.content}
        >
          {/* Menu Section */}
          <LayoutCompositionFactory.Stack
            direction="column"
            gap="lg"
            responsive={true}
          >
              <LayoutCompositionFactory.Flex
                direction="row"
                alignment="center"
                justify="between"
                gap="md"
                responsive={true}
                className={styles.menuHeader}
              >
                <h2 className={styles.sectionTitle}>Menu</h2>
                {items && items.length > 0 && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCarousel(true)}
                  >
                    📱 View Carousel
                  </Button>
                )}
              </LayoutCompositionFactory.Flex>

              {/* Bundles Section */}
              {bundles.length > 0 && (
                <LayoutCompositionFactory.Stack
                  direction="column"
                  gap="md"
                  responsive={true}
                  className="mb-8"
                >
                  <h3 className="text-xl font-semibold">Bundle Deals</h3>
                  <LayoutCompositionFactory.Grid
                    columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                    gap="md"
                    responsive={true}
                  >
                    {bundles.map((bundle) => (
                      <CardCompositionFactory.Custom
                        key={bundle.id}
                        layout="vertical"
                        size="md"
                        features={{
                          actions: { primary: { label: 'View Bundle' } },
                          meta: { price: { amount: bundle.price || 0 } }
                        }}
                        responsive={true}
                        interactive={true}
                      >
                        <BundleGrid
                          bundles={[bundle]}
                          columns={1}
                          showSavings={true}
                          compact={false}
                        />
                      </CardCompositionFactory.Custom>
                    ))}
                  </LayoutCompositionFactory.Grid>
                </LayoutCompositionFactory.Stack>
              )}

              <DataState
                data={items}
                isLoading={itemsLoading}
                error={itemsError ?? undefined}
                emptyMessage="No menu items available"
              >
                {(items) => (
                  <LayoutCompositionFactory.Stack
                    direction="column"
                    gap="lg"
                    responsive={true}
                  >
                    <LayoutCompositionFactory.Grid
                      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                      gap="md"
                      responsive={true}
                      className={styles.grid}
                    >
                      {items.map((item) => (
                        <CardCompositionFactory.Product
                          key={item.id}
                          layout="vertical"
                          size="md"
                          features={{
                            image: { aspectRatio: '4/3', zoom: true },
                            actions: { primary: { label: 'Add to Cart' } },
                            meta: { price: { amount: item.price || 0 } }
                          }}
                          responsive={true}
                          interactive={true}
                        >
                          <ItemCard item={item} />
                        </CardCompositionFactory.Product>
                      ))}
                    </LayoutCompositionFactory.Grid>
                    
                    {showCarousel && (
                      <ItemCarouselCompact
                        items={items}
                        storeName={store?.name || ''}
                        onClose={() => setShowCarousel(false)}
                      />
                    )}
                  </LayoutCompositionFactory.Stack>
                )}
              </DataState>
            </LayoutCompositionFactory.Stack>

          {/* River Feed Section */}
          <LayoutCompositionFactory.Stack
            direction="column"
            gap="lg"
            responsive={true}
            className="mt-8 pt-8 border-t border-border"
          >
            <h2 className="text-2xl font-bold text-foreground">Store Updates</h2>
            
            {/* TODO: Uncomment when Posts API is available */}
            {/* {riverPosts.length > 0 ? (
              <RiverFeed
                posts={riverPosts}
                isLoading={riverLoading}
                error={riverError}
                hasMore={false}
                onLoadMore={() => {}}
                onPostClick={(postId) => console.log('Post clicked:', postId)}
                onLike={(postId) => console.log('Like post:', postId)}
                onComment={(postId) => console.log('Comment on post:', postId)}
                onShare={(postId) => console.log('Share post:', postId)}
              />
            ) : ( */}
              <div className="p-8 text-center text-gray-500">
                <p>River feed is temporarily disabled while we update the Posts API.</p>
                <p className="text-sm text-gray-400 mt-2">
                  This feature will show store updates, customer posts, and social content.
                </p>
              </div>
            {/* )} */}
          </LayoutCompositionFactory.Stack>
        </LayoutCompositionFactory.Stack>
      </LayoutCompositionFactory.Stack>
    </PageCompositionFactory.App>
  )
}

