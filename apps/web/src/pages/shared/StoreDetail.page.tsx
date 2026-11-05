/**
 * StoreDetailPage - a store's public storefront (`/kitchen/:slug`): the vendor's business page and menu.
 * Presentation comes from the store's published storefront config; the menu, availability and business
 * details are live.
 */
import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useStore } from '@shared/hooks/hooks/useStores'
import { isStorePublic } from '@shared/lib/utils/isStorePublic'
import { parseStoreSlug } from '@shared/lib/utils/slugify'
import { StateBlock } from '@shared/ui/primitives/ui/StateBlock/StateBlock'
import { usePageTitle } from '@/hooks/usePageTitle'
import { apiClient } from '@api/client'
import type { MediaItem } from '@api/types'
import { StoreFeedSection } from '@/features/river/components/StoreFeedSection/StoreFeedSection'
import { PostComposer } from '@/features/river/components/PostComposer/PostComposer'
import { useAuthStore } from '@stores/authStore'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { recordRecent } from '@features/home/neighborhood/recentViews'
import { useVendorStores } from '@shared/hooks/hooks/vendor'
import { useMenuSections } from '@shared/hooks/hooks/useMenuSections'
import { useStoreItems } from '@shared/hooks/hooks/vendor/useStoreItems'
import { Storefront } from '@features/storefront/Storefront'
import { useStorefront } from '@features/storefront/api'

/** Height of the shopping chrome above the page; the menu bar sticks just under it. */
const CHROME_HEIGHT_PX = 60

export default function StoreDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { slug, storeId: storeIdParam, id } = useParams<{ slug?: string; storeId?: string; id?: string }>()
  const legacyOrSlug = slug ?? storeIdParam ?? id
  const { id: parsedStoreId } = legacyOrSlug ? parseStoreSlug(legacyOrSlug) : { id: undefined }
  const storeId = parsedStoreId ?? legacyOrSlug

  const { data: store, isLoading: isStoreLoading, error: storeError } = useStore(storeId ?? '')
  const storeIsPublic = isStorePublic(store)
  const enabled = storeIsPublic && !!storeId

  // The whole menu in one request; the server returns only what shoppers may see.
  const { data: rawItems, isLoading: isItemsLoading, error: itemsError } = useStoreItems(enabled ? storeId : undefined)
  // A vendor viewing their own store gets every item back; show them what a shopper sees.
  const items = useMemo(() => (rawItems ?? []).filter((item) => item.isActive !== false), [rawItems])
  const { data: sections = [] } = useMenuSections(storeId, { view: 'shopper', enabled })
  const { data: storefront, isLoading: isStorefrontLoading, error: storefrontError } = useStorefront(storeId, { enabled })

  usePageTitle(storeIsPublic ? store?.name : undefined, 'ShopShop')

  useEffect(() => {
    if (!store || !storeIsPublic) return
    const pictured = store as typeof store & {
      imageUrl?: string
      mediaAssets?: readonly { url: string; kind?: string }[]
    }
    const imageUrl = pictured.mediaAssets?.find((asset) => asset.url && asset.kind !== 'VIDEO')?.url ?? pictured.imageUrl
    recordRecent({
      id: store.id,
      kind: 'store',
      title: store.name,
      imageUrl,
      path: getStoreRoute({ id: store.id, name: store.name }),
    })
  }, [store, storeIsPublic])

  const { data: managedStores = [] } = useVendorStores()
  const canPost = Boolean(
    store &&
      user &&
      managedStores.some(
        (s) => s.id === store.id && (s.isOwner || s.permissions.includes('FULL_ACCESS') || s.permissions.includes('MANAGE_ITEMS')),
      ),
  )

  const handlePost = useCallback(
    async (content: string, media: MediaItem[]) => {
      if (!store?.id) return
      try {
        await apiClient.river.createPost({ storeId: store.id, content, mediaUrls: media, source: 'MANUAL' })
        toast.success('Update published')
        await queryClient.invalidateQueries({ queryKey: ['store-feed', store.id] })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not publish update')
        throw error
      }
    },
    [queryClient, store],
  )

  if (isStoreLoading) {
    return <StateBlock title="Loading store" message="One moment while we open this store." />
  }

  if (storeError || !store || !storeIsPublic) {
    return (
      <StateBlock
        title="Store not found"
        message="This store could not be loaded."
        actionLabel="Back to browsing"
        onAction={() => navigate('/')}
      />
    )
  }

  if (itemsError || storefrontError) {
    return (
      <StateBlock
        title="Menu unavailable"
        message={(itemsError ?? storefrontError)?.message ?? 'Please try again.'}
        actionLabel="Retry"
        onAction={() => navigate(0)}
      />
    )
  }

  if (isItemsLoading || isStorefrontLoading || !storefront) {
    return <StateBlock title="Loading menu" message="One moment while we load the menu." />
  }

  const storeName = store.name
  const updates = (
    <>
      {canPost ? (
        <PostComposer
          variant="prominent"
          storeId={store.id}
          storeName={storeName}
          storeImage={(store as { imageUrl?: string | null }).imageUrl ?? undefined}
          onPost={handlePost}
        />
      ) : null}
      <StoreFeedSection storeId={store.id} storeName={storeName} showFeedHeader={false} layout="store" />
    </>
  )

  return (
    <Storefront
      store={store}
      data={storefront}
      items={items}
      sections={sections}
      bundles={storefront.bundles}
      mode="live"
      stickyTop={CHROME_HEIGHT_PX}
      updates={updates}
    />
  )
}
