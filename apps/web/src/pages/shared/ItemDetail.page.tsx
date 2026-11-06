// @ts-nocheck
/**
 * ItemDetailPage - Display full item details
 * Canonical route:
 *   /items/:itemId
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { DiscoveryLink as Link } from '@features/discovery-navigation/DiscoveryLink'
import { useItem } from '@shared/hooks/generated'
import { useStore } from '@shared/hooks/generated'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { isStorePublic } from '@shared/lib/utils/isStorePublic'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { recordRecent } from '@features/home/neighborhood/recentViews'
import { Button, Spinner } from '@shared/ui/primitives'
import { formatCurrency } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import { ArrowLeft } from 'lucide-react'
import { useHaptics } from '@shared/hooks/useHaptics'
import { getImageUrl } from '@shared/lib/utils/image'

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const haptics = useHaptics()
  const [photoIndex, setPhotoIndex] = useState(0)

  const { data: item, isLoading, error } = useItem(itemId || '')
  const targetStoreId = item?.storeId
  const { data: store, isLoading: isStoreLoading } = useStore(targetStoreId || '', { enabled: !!targetStoreId } as any)
  const storeIsPublic = isStorePublic(store)
  const addToCart = useAddToCart()

  usePageTitle(storeIsPublic ? item?.name : undefined, storeIsPublic ? store?.name : undefined, 'ShopShop')

  // Use mediaAssets from item data (now included in backend queries)
  const itemMedia = (item as any)?.mediaAssets || []

  useEffect(() => {
    if (!item?.id || !item.title) return
    const photo = (itemMedia as { url?: string; kind?: string }[]).find(
      (media) => media.url && (!media.kind || media.kind === 'IMAGE'),
    )
    recordRecent({
      id: item.id,
      kind: 'item',
      title: item.title,
      imageUrl: photo?.url,
      subtitle: store?.name,
      path: getItemRouteSimple({ id: item.id, title: item.title }),
    })
  }, [item?.id, item?.title, store?.name])

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    if (storeIsPublic && store) {
      navigate(getStoreRoute({ id: store.id, name: store.name }))
      return
    }
    navigate('/search')
  }

  const handleAddToCart = () => {
    if (!item) return
    haptics.medium()
    addToCart.mutate({
      storeId: item.storeId,
      itemId: item.id,
      quantity: 1,
      title: item.title,
      unitPrice: item.price,
      item,
    })
  }

  if (isLoading || (targetStoreId && isStoreLoading)) {
    return (
      <div className="home-stack">
        <Spinner size="large" />
      </div>
    )
  }

  if (error || !item || (targetStoreId && !storeIsPublic)) {
    return (
      <div className="home-stack">
        <h2 className="text-base font-semibold">Item not found</h2>
        <p className="text-sm" style={{ color: 'var(--quiet)' }}>
          {error?.message || 'This item is not available.'}
        </p>
        <Button variant="outline" onClick={handleBack}>
          Go back
        </Button>
      </div>
    )
  }

  const price = parsePrice(item.price)
  const photos = (itemMedia as { url?: string; kind?: string }[]).filter(
    (media) => media.url && (!media.kind || media.kind === 'IMAGE'),
  )
  const activePhoto = photos[photoIndex] ?? photos[0]
  const photoSrc = activePhoto?.url ?? getImageUrl(undefined, item.id, 'item')

  return (
    <div className="home-stack" style={{ maxWidth: '40rem' }}>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex min-h-11 items-center gap-1 text-sm"
        style={{ color: 'var(--quiet)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <img className="media-frame" src={photoSrc} alt="" />

      {photos.length > 1 ? (
        <div className="shelf-row">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setPhotoIndex(index)}
              className="product-tile"
              aria-label={`Photo ${index + 1}`}
            >
              <img src={photo.url} alt="" style={{ outline: index === photoIndex ? '1px solid var(--ink)' : undefined }} />
            </button>
          ))}
        </div>
      ) : null}

      <div>
        {store ? (
          <Link
            to={getStoreRoute({ id: store.id, name: store.name })}
            className="text-sm"
            style={{ color: 'var(--quiet)' }}
          >
            {store.name}
          </Link>
        ) : null}
        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold leading-snug">{item.title}</h1>
          <p className="shrink-0 text-base font-medium">{formatCurrency(price)}</p>
        </div>
        {item.isSoldOut ? (
          <p className="mt-2 text-sm" style={{ color: 'var(--quiet)' }}>Sold out</p>
        ) : null}
        {item.description ? (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--quiet)' }}>{item.description}</p>
        ) : null}
      </div>

      <Button
        variant="primary"
        size="large"
        fullWidth
        onClick={handleAddToCart}
        disabled={item.isSoldOut || !item.isActive || addToCart.isPending}
      >
        {addToCart.isPending ? 'Adding…' : 'Add to cart'}
      </Button>
    </div>
  )
}
