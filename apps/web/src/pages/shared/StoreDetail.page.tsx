import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@shared/hooks/hooks/useStores'
import { useItems } from '@shared/hooks/generated'
import { useCart } from '@shared/hooks/hooks/useCart'
import { parseStoreSlug } from '@shared/lib/utils/slugify'
import { StoreHeader } from '@features/stores/components/StoreHeader'
import { StateBlock } from '@shared/ui/primitives/ui/StateBlock/StateBlock'
import { PageShell } from '@shared/ui/layout/PageShell'
import { CartBadge } from '@components/CartBadge'
import { usePageTitle } from '@/hooks/usePageTitle'
import { bundles as bundlesApi } from '@api/apiWrapper'
import type { Bundle, ItemResponse } from '@api/backend-types'
import { ItemCard } from '@features/products/components/ItemCard'
import { StoreFeedSection } from '@/features/river/components/StoreFeedSection/StoreFeedSection'

// Canonical display order for ITEM_TYPE tag sections
const ITEM_TYPE_ORDER = [
  'entree', 'sandwich', 'salad', 'side', 'bread',
  'pastry', 'cake', 'dessert', 'drink',
  'tray', 'family-meal', 'box', 'bundle-item',
]

function groupItemsByType(items: ItemResponse[]): { label: string; items: ItemResponse[] }[] {
  const ungrouped: ItemResponse[] = []
  const grouped = new Map<string, { label: string; items: ItemResponse[] }>()

  for (const item of items) {
    const typeTag = item.tags?.find((t) => t.category === 'ITEM_TYPE')
    if (!typeTag) {
      ungrouped.push(item)
      continue
    }
    const existing = grouped.get(typeTag.slug)
    if (existing) {
      existing.items.push(item)
    } else {
      grouped.set(typeTag.slug, { label: typeTag.label, items: [item] })
    }
  }

  // Sort groups by canonical menu order, then alphabetically for unknown types
  const sections = [...grouped.entries()]
    .sort(([a], [b]) => {
      const ai = ITEM_TYPE_ORDER.indexOf(a)
      const bi = ITEM_TYPE_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    .map(([, section]) => section)

  // Ungrouped items go first if they're the majority, last otherwise
  if (ungrouped.length > 0) {
    const label = sections.length === 0 ? 'Menu' : 'Other'
    if (sections.length === 0) return [{ label, items: ungrouped }]
    sections.push({ label, items: ungrouped })
  }

  return sections
}

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
    { enabled: Boolean(storeId) },
  )

  const { data: bundlesData, isLoading: isBundlesLoading } = useQuery({
    queryKey: ['bundles', storeId, 'public'],
    queryFn: () => bundlesApi.list({ storeId, isActive: true }),
    enabled: Boolean(storeId),
  })

  const bundles: Bundle[] = bundlesData ?? []

  usePageTitle(store?.name, 'ShopShop')

  const cartCount = useMemo(() => {
    if (!cart?.items || !Array.isArray(cart.items)) return 0
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [cart?.items])

  const menuSections = useMemo(
    () => groupItemsByType(items ?? []),
    [items],
  )

  if (isStoreLoading) {
    return <StateBlock title="Loading kitchen" message="Please wait while we load this kitchen." />
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

  if (isItemsLoading || isBundlesLoading) {
    return <StateBlock title="Loading menu" message="Please wait while we load menu items." />
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

  const hasContent = (items?.length ?? 0) > 0 || bundles.length > 0
  const acceptsOnlineCards = (store as { acceptsOnlineCardPayments?: boolean }).acceptsOnlineCardPayments

  return (
    <div className="space-y-8">
      <StoreHeader store={store} />

      <StoreFeedSection storeId={store.id} storeName={store.name} />

      {!hasContent ? (
        <p className="text-sm text-muted-foreground">
          No active menu items right now.{' '}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => navigate('/search')}
          >
            Back to search
          </button>
        </p>
      ) : null}

      {hasContent && acceptsOnlineCards === false ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          This store is not accepting online card payments yet (Stripe Connect setup may still be in progress). You can
          still browse the menu — choose another payment option at checkout if available, or contact the store.
        </div>
      ) : null}

      {hasContent && menuSections.length > 0
        ? menuSections.map((section) => (
            <section key={section.label}>
              <h2 className="mb-4 text-xl font-bold text-foreground">{section.label}</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {section.items.map((item) => (
                  <ItemCard key={item.id} item={item} store={{ id: store.id, name: store.name }} />
                ))}
              </div>
            </section>
          ))
        : null}

      <aside className="sticky bottom-4 z-20 p-4 rounded-xl border shadow-lg backdrop-blur border-border bg-background/95">
        <div className="flex gap-3 justify-between items-center">
          <div className="flex gap-2 items-center">
            <CartBadge count={cartCount} />
            <div>
              <p className="text-sm text-muted-foreground">Cart</p>
              <p className="font-semibold">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
          <Link
            to="/cart"
            className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md transition bg-primary text-primary-foreground hover:opacity-90"
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
