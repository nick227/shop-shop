// @ts-nocheck
/**
 * ItemDetailPage - Display full item details
 * Canonical route:
 *   /items/:itemId
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useItem } from '@shared/hooks/generated'
import { useStore } from '@shared/hooks/generated'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { Button, Spinner, Badge } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { PageContainer, SectionHeader } from '@shared/ui/layout/PageLayout'
import { formatCurrency } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { useHaptics } from '@shared/hooks/useHaptics'
import { CustomerMediaGallery } from '@shared/ui/media'
import { StoreHeader } from '@features/stores/components/StoreHeader'

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const haptics = useHaptics()

  const { data: item, isLoading, error } = useItem(itemId || '')
  const targetStoreId = item?.storeId
  const { data: store } = useStore(targetStoreId || '', { enabled: !!targetStoreId } as any)
  const addToCart = useAddToCart()

  usePageTitle(item?.name, store?.name, 'ShopShop')

  // Use mediaAssets from item data (now included in backend queries)
  const itemMedia = (item as any)?.mediaAssets || []

  const handleBack = () => {
    if (store) {
      const route = getStoreRoute({ id: store.id, name: store.name })
      navigate(route)
    } else if (targetStoreId) {
      navigate('/kitchen/' + targetStoreId + '')
    } else {
      navigate('/')
    }
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

  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="large" />
        <p className="mt-4 text-sm text-muted-foreground">Loading item...</p>
      </PageContainer>
    )
  }

  if (error || !item) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="mb-2 text-lg font-semibold text-destructive">Item Not Found</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error?.message || 'The item you are looking for does not exist.'}
        </p>
        <Button variant="outline" onClick={handleBack}>
          Go Back
        </Button>
      </PageContainer>
    )
  }

  const price = parsePrice(item.price)

  return (
    <PageContainer className="max-w-[640px] mx-auto rounded-xl shadow-lg">

    {/* Store title */}
    <StoreHeader showMap={false} store={store} />
    
      <Button
        variant="ghost"
        size="small"
        onClick={handleBack}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="mr-1 w-4 h-4" />
        Back
      </Button>

      <div className="flex flex-col gap-5">

        {/* Title + Price */}
        <div className="flex gap-4 justify-between items-start">
          <div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">{item.title}</h1>
            <div className="flex flex-wrap gap-2">
              {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
              {!item.isActive && <Badge variant="warning">Inactive</Badge>}
            </div>
          </div>
          <div className="text-2xl font-bold text-primary shrink-0">{formatCurrency(price)}</div>
        </div>

        {/* Media Gallery */}
        {itemMedia && itemMedia.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <CustomerMediaGallery media={itemMedia} />
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {item.description && (
          <Card>
            <CardContent className="pt-5">
              <SectionHeader title="Description" className="mb-3" />
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Add to Cart */}
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={handleAddToCart}
          disabled={item.isSoldOut || !item.isActive || addToCart.isPending}
        >
          <ShoppingCart className="mr-2 w-5 h-5" />
          {addToCart.isPending ? 'Adding...' : ''}
        </Button>
      </div>
    </PageContainer>
  )
}
