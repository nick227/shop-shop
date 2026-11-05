/**
 * Storefront - one renderer for a store's public page, used by the live storefront and by the vendor's
 * editor preview so what the vendor sees is what shoppers get.
 *
 * Order: business header and ordering details first, then the optional merchandising sections the vendor
 * arranged, then the full menu, then business content. The menu is always there and never follows
 * business content, so shoppers reach products without scrolling a whole website.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { ItemResponse } from '@api/types'
import {
  FEATURED_DEFAULT_COUNT,
  resolveBundleIds,
  resolveFeaturedItemIds,
  type BeforeMenuSection,
  type StorefrontConfig,
} from '@packages/shared/storefront'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { cn } from '@shared/lib/cn'
import { groupItemsBySection, type MenuSection } from '@shared/lib/menu/menuSections'
import type { StorefrontData } from './api'
import { StorefrontProvider, canOrderItem, type StorefrontActions, type StorefrontMode } from './context'
import { storefrontAppearanceClass, storefrontThemeStyle } from './theme'
import { BusinessHeader } from './components/BusinessHeader'
import { OrderingStrip } from './components/OrderingStrip'
import { MediaMosaic, type ResolvedMosaicTile } from './components/MediaMosaic'
import { Announcements, BundlesRow, CategoryTiles, FeaturedRow, type StorefrontBundle } from './components/Merchandising'
import { StorefrontMenu, scrollToSection } from './components/StorefrontMenu'
import { AboutSection, GallerySection, UpdatesSection } from './components/BusinessContent'
import { ItemSheet } from './components/ItemSheet'
import { CartBar } from './components/CartBar'
import { itemImage } from './components/ProductTile'
import './storefront.css'

const CAROUSEL_COUNT = 5

export interface StorefrontProps {
  readonly store: StoreHeaderStore
  readonly data: StorefrontData
  /** The config to render; the editor passes the draft being edited. Defaults to `data.config`. */
  readonly config?: StorefrontConfig
  /** Items shoppers may see. */
  readonly items: readonly ItemResponse[]
  readonly sections: readonly MenuSection[]
  readonly bundles: readonly StorefrontBundle[]
  readonly mode: StorefrontMode
  readonly stickyTop: number
  readonly scrollRoot?: HTMLElement | null
  /** The store's updates feed (live page only). */
  readonly updates?: ReactNode
  /** Editor only: each part of the page offers an "Edit" button that calls this with its key. */
  readonly onEditSection?: (key: StorefrontPartKey) => void
  /** Editor only: the part to outline, so the vendor sees what the open settings change. */
  readonly highlight?: StorefrontPartKey | null
  readonly className?: string
}

/** Every part of the page, in the order it can appear. */
export type StorefrontPartKey = 'header' | 'ordering' | BeforeMenuSection | 'menu' | 'about' | 'gallery' | 'updates'

const PART_LABELS: Record<StorefrontPartKey, string> = {
  header: 'brand',
  ordering: 'ordering details',
  mosaic: 'mosaic',
  announcements: 'announcements',
  bundles: 'bundles',
  featured: 'featured products',
  categories: 'category tiles',
  menu: 'menu layout',
  about: 'business information',
  gallery: 'gallery',
  updates: 'updates',
}

export function Storefront({
  store,
  data,
  config = data.config,
  items,
  sections,
  bundles,
  mode,
  stickyTop,
  scrollRoot = null,
  updates,
  onEditSection,
  highlight = null,
  className,
}: StorefrontProps) {
  const part = (key: StorefrontPartKey, children: ReactNode) => (
    <Part key={key} partKey={key} onEdit={onEditSection} highlighted={highlight === key}>
      {children}
    </Part>
  )
  const addToCart = useAddToCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [previewItemId, setPreviewItemId] = useState<string | null>(null)

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const openItemId = mode === 'live' ? searchParams.get('item') : previewItemId
  const openItemData = openItemId ? itemsById.get(openItemId) ?? null : null

  const openItem = useCallback(
    (item: ItemResponse) => {
      if (mode === 'preview') return setPreviewItemId(item.id)
      // The open item is in the address, so it can be shared and the back button closes it.
      const next = new URLSearchParams(searchParams)
      next.set('item', item.id)
      setSearchParams(next)
    },
    [mode, searchParams, setSearchParams],
  )
  const closeItem = useCallback(() => {
    if (mode === 'preview') return setPreviewItemId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('item')
    setSearchParams(next, { replace: true })
  }, [mode, searchParams, setSearchParams])

  const addItem = useCallback(
    (item: ItemResponse, quantity = 1) => {
      if (mode === 'preview') {
        toast.info('Shoppers add items to their cart here.')
        return
      }
      if (!data.ordering.acceptingOrders) toast.info(data.ordering.message ?? 'This store isn’t taking orders right now.')
      addToCart.mutate({ storeId: item.storeId, itemId: item.id, quantity, title: item.title, unitPrice: item.price, item })
    },
    [mode, addToCart, data.ordering],
  )

  const theme = useMemo(
    () => ({ className: storefrontAppearanceClass(config.brand.appearance), style: storefrontThemeStyle(config.brand) }),
    [config.brand],
  )

  const actions: StorefrontActions = useMemo(
    () => ({
      store: { id: store.id, name: store.name },
      mode,
      acceptingOrders: data.ordering.acceptingOrders,
      openItem,
      addItem,
      stickyTop,
      scrollRoot,
      theme,
    }),
    [store.id, store.name, mode, data.ordering.acceptingOrders, openItem, addItem, stickyTop, scrollRoot, theme],
  )

  // The vendor's sections; items of a hidden section (returned only to the store's team) stay off the page.
  const groups = useMemo(() => {
    const visible = new Set(sections.filter((section) => section.isVisible).map((section) => section.id))
    const shown = items.filter((item) => !item.sectionId || visible.has(item.sectionId))
    return groupItemsBySection(
      shown,
      sections.filter((section) => section.isVisible),
      { unsectionedName: visible.size > 0 ? 'More' : 'Menu' },
    )
  }, [items, sections])

  const orderable = useCallback((id: string) => {
    const item = itemsById.get(id)
    return !!item && canOrderItem(item)
  }, [itemsById])

  // Popular first; a store without sales yet falls back to its pictured items in menu order.
  const popularity = useMemo(() => {
    const pictured = groups.flatMap((group) => group.items).filter((item) => itemImage(item)).map((item) => item.id)
    return [...new Set([...data.popularItemIds, ...pictured])]
  }, [data.popularItemIds, groups])

  const featured = useMemo(
    () => resolveFeaturedItemIds(config.featured, popularity, orderable, FEATURED_DEFAULT_COUNT).map((id) => itemsById.get(id)!),
    [config.featured, popularity, orderable, itemsById],
  )

  const carousel = useMemo(() => {
    const lead = config.mosaic.featuredItemId ? itemsById.get(config.mosaic.featuredItemId) : undefined
    const pool = [...(lead ? [lead] : []), ...featured].filter((item) => itemImage(item))
    return [...new Map(pool.map((item) => [item.id, item])).values()].slice(0, CAROUSEL_COUNT)
  }, [config.mosaic.featuredItemId, featured, itemsById])

  const tiles = useMemo(() => {
    const mediaById = new Map(data.media.map((m) => [m.id, m]))
    return config.mosaic.tiles.flatMap((tile): ResolvedMosaicTile[] => {
      if (tile.type === 'media') {
        const media = mediaById.get(tile.mediaId)
        return media ? [{ type: 'media', media }] : []
      }
      const item = itemsById.get(tile.itemId)
      return item ? [{ type: 'item', item }] : []
    })
  }, [config.mosaic.tiles, data.media, itemsById])

  const shownBundles = useMemo(() => {
    const active = bundles.filter((bundle) => bundle.isActive !== false)
    const byId = new Map(active.map((bundle) => [bundle.id, bundle]))
    return resolveBundleIds(config.featured, active.map((bundle) => bundle.id)).map((id) => byId.get(id)!)
  }, [bundles, config.featured])

  const jumpOffset = stickyTop + 104
  const beforeMenu: Record<BeforeMenuSection, ReactNode> = {
    mosaic: <MediaMosaic products={carousel} tiles={tiles} storeName={store.name} />,
    announcements: <Announcements panels={config.announcements} itemsById={itemsById} />,
    bundles: <BundlesRow bundles={shownBundles} />,
    featured: <FeaturedRow items={featured} />,
    categories: <CategoryTiles groups={groups} onJump={(id) => scrollToSection(id, scrollRoot, jumpOffset)} />,
  }
  const afterMenu = {
    about: <AboutSection store={store} hours={data.hours} showMap={mode === 'live'} />,
    gallery: <GallerySection media={data.media} storeName={store.name} />,
    updates: updates ? <UpdatesSection>{updates}</UpdatesSection> : null,
  }

  return (
    <StorefrontProvider value={actions}>
      <div className={cn('sf-root', theme.className, className)} style={theme.style}>
        <div className="mx-auto max-w-6xl space-y-8 px-4 pb-10 pt-6">
          {part('header', <BusinessHeader store={store} tagline={config.brand.tagline} logoUrl={store.imageUrl ?? null} />)}
          {part('ordering', <OrderingStrip ordering={data.ordering} hours={data.hours} />)}

          {config.sections.beforeMenu.filter((section) => section.visible).map((section) => part(section.key, beforeMenu[section.key]))}

          {part(
            'menu',
            groups.length > 0 ? (
              <StorefrontMenu groups={groups} presentation={config.presentation} />
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing on the menu right now. Check back soon.
              </p>
            ),
          )}

          {config.sections.afterMenu.filter((section) => section.visible).map((section) => part(section.key, afterMenu[section.key]))}

          {mode === 'live' ? <CartBar storeId={store.id} /> : null}
        </div>
        <ItemSheet item={openItemData} onClose={closeItem} />
      </div>
    </StorefrontProvider>
  )
}

/**
 * One part of the page. In the editor it can be outlined and offers an "Edit" button; parts that render
 * nothing (no announcements, no bundles) take no space.
 */
function Part({ partKey, onEdit, highlighted, children }: {
  readonly partKey: StorefrontPartKey
  readonly onEdit?: (key: StorefrontPartKey) => void
  readonly highlighted: boolean
  readonly children: ReactNode
}) {
  if (!onEdit) {
    return (
      <div data-storefront-section={partKey} className="empty:hidden">
        {children}
      </div>
    )
  }
  return (
    <div
      data-storefront-section={partKey}
      data-highlighted={highlighted || undefined}
      className="sf-part group/part relative rounded-2xl has-[>div:empty]:hidden"
    >
      <div>{children}</div>
      <button
        type="button"
        onClick={() => onEdit(partKey)}
        className="sf-part-edit absolute right-2 top-2 z-30 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-md"
      >
        Edit {PART_LABELS[partKey]}
      </button>
    </div>
  )
}
