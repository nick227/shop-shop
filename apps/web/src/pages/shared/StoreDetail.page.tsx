import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@shared/hooks/hooks/useStores'
import { useItems } from '@shared/hooks/generated'
import { useCart } from '@shared/hooks/hooks/useCart'
import { parseStoreSlug } from '@shared/lib/utils/slugify'
import { StoreHeader } from '@features/stores/components/StoreHeader'
import { ItemCard } from '@features/products/components'
import { Button } from '@shared/ui/primitives'
import { StateBlock } from '@shared/ui/primitives/ui/StateBlock/StateBlock'
import { PageShell } from '@shared/ui/layout/PageShell'
import { CartBadge } from '@components/CartBadge'

function KitchenContainer() {
  const navigate = useNavigate()
  const { slug, storeId: storeIdParam, id } = useParams<{ slug?: string; storeId?: string; id?: string }>()
  const legacyOrSlug = slug ?? storeIdParam ?? id
  const { id: parsedStoreId } = legacyOrSlug ? parseStoreSlug(legacyOrSlug) : { id: undefined }
  const storeId = parsedStoreId ?? legacyOrSlug
  const { cart } = useCart()

  const { data: store, isLoading: isStoreLoading, error: storeError } = useStore(storeId ?? '')
  const { data: items, isLoading: isItemsLoading, error: itemsError } = useItems(
    storeId ? { storeId } : undefined,
    { enabled: Boolean(storeId) }
  )

  const cartCount = useMemo(() => {
    if (!cart?.items || !Array.isArray(cart.items)) return 0
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [cart?.items])

  if (isStoreLoading) {
    return (
      <StateBlock
        title="Loading kitchen"
        message="Please wait while we load this kitchen."
      />
    )
  }

  if (storeError || !store) {
    return (
      <StateBlock
        title="Kitchen not found"
        message={storeError?.message ?? 'The kitchen could not be loaded.'}
        actionLabel="Back to search"
        onAction={() => navigate('/search')}
      />
    )
  }

  if (isItemsLoading) {
    return (
      <StateBlock
        title="Loading menu"
        message="Please wait while we load menu items."
      />
    )
  }

  if (itemsError) {
    return (
      <StateBlock
        title="Menu unavailable"
        message={itemsError.message}
        actionLabel="Retry"
        onAction={() => navigate(0)}
      />
    )
  }

  if (!items || items.length === 0) {
    return (
      <StateBlock
        title="No items yet"
        message="This kitchen has no active menu items right now."
        actionLabel="Back to search"
        onAction={() => navigate('/search')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <StoreHeader store={store} />

      <section>
        <h2 className="mb-4 text-xl font-bold text-foreground">Menu</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} store={{ id: store.id, name: store.name }} />
          ))}
        </div>
      </section>

      <aside className="sticky bottom-4 z-20 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CartBadge count={cartCount} />
            <div>
            <p className="text-sm text-muted-foreground">Cart</p>
            <p className="font-semibold">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </p>
            </div>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            View cart
          </Link>
        </div>
      </aside>
    </div>
  )
}

export default function StoreDetailPage() {
  return (
    <PageShell className="bg-background" containerClassName="max-w-7xl" contentClassName="py-8 md:py-8">
      <KitchenContainer />
    </PageShell>
  )
}
