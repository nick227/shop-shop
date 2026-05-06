// @ts-nocheck
/**
 * ItemDetailPage - Display full item details
 * Canonical route:
 *   /items/:itemId
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useItem } from '@shared/hooks/generated'
import { useStore } from '@shared/hooks/generated'
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
import { useQuery } from '@tanstack/react-query'

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const haptics = useHaptics()

  const { data: item, isLoading, error } = useItem(itemId || '')
  const targetStoreId = item?.storeId
  const { data: store } = useStore(targetStoreId || '', { enabled: !!targetStoreId } as any)
  const addToCart = useAddToCart()

  // Fetch item media for gallery
  const { data: itemMedia } = useQuery({
    queryKey: ['item-media', itemId],
    queryFn: async () => {
      if (!itemId) return []
      const response = await fetch(`/media?itemId=${itemId}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch item media')
      }
      const data = await response.json()
      return data.data || []
    },
    enabled: !!itemId,
  })

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
        <p className="mt-4 text-muted-foreground text-sm">Loading item...</p>
      </PageContainer>
    )
  }

  if (error || !item) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-lg font-semibold text-destructive mb-2">Item Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">{error?.message || 'The item you are looking for does not exist.'}</p>
        <Button variant="outline" onClick={handleBack}>Go Back</Button>
      </PageContainer>
    )
  }

  const price = parsePrice(item.price)

  return (
    <PageContainer>
      <Button variant="ghost" size="small" onClick={handleBack} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <div className="flex flex-col gap-5">
        {/* Title + Price */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{item.title}</h1>
            <div className="flex gap-2 flex-wrap">
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
              <SectionHeader title="Photos & Videos" className="mb-3" />
              <CustomerMediaGallery media={itemMedia} />
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {item.description && (
          <Card>
            <CardContent className="pt-5">
              <SectionHeader title="Description" className="mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Availability */}
        {typeof item.stockQty === 'number' && (
          <Card>
            <CardContent className="pt-5">
              <SectionHeader title="Availability" className="mb-3" />
              <p className="text-sm text-muted-foreground">
                {item.stockQty > 0
                  ? `${String(item.stockQty)} items in stock`
                  : 'Out of stock'}
              </p>
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
          <ShoppingCart className="w-5 h-5 mr-2" />
          {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
        </Button>
      </div>
    </PageContainer>
  )
}
