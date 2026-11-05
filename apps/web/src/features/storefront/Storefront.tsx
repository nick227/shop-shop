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
  type AfterMenuSection,
  type BeforeMenuSection,
  type StorefrontConfig,
} from '@packages/shared/storefront'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { cn } from '@shared/lib/cn'
import { groupItemsBySection, matchesMenuSearch, type MenuSection } from '@shared/lib/menu/menuSections'
import type { StorefrontData } from './api'
import { StorefrontProvider, canOrderItem, type StorefrontActions, type StorefrontMode } from './context'
import { storefrontAppearanceClass, storefrontThemeStyle } from './theme'
import { BusinessHeader } from './components/BusinessHeader'
import { OrderingStrip } from './components/OrderingStrip'
import { MediaMosaic, type ResolvedMosaicTile } from './components/MediaMosaic'
import { Announcements, BundlesRow, CategoryTiles, FeaturedRow, type StorefrontBundle } from './components/Merchandising'
import { LARGE_CATALOG_ITEMS, MenuBar, MenuSections, scrollToSection, useActiveSection } from './components/StorefrontMenu'
import { AboutSection, GallerySection, UpdatesSection } from './components/BusinessContent'
import { ItemSheet } from './components/ItemSheet'
import { CartBar } from './components/CartBar'
import { itemImage } from './components/ProductTile'
import './storefront.css'

const CAROUSEL_COUNT = 5
/** Side tiles the mosaic fills on its own when the vendor hasn't arranged any. */
const AUTO_TILES = 4
/** Category tiles help find a department in a big store; a short menu has the section links. */
const CATEGORY_TILES_MIN_SECTIONS = 8

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
  /** Editor only: show or hide an optional section from the preview itself. */
  readonly onToggleSection?: (key: BeforeMenuSection | AfterMenuSection, visible: boolean) => void
  /** False for a directory profile: same page, without ordering, an empty menu, or a cart. */
  readonly commerce?: boolean
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
  onToggleSection,
  className,
  commerce = true,
}: StorefrontProps) {
  const part = (key: StorefrontPartKey, children: ReactNode, onHide?: () => void) => (
    <Part key={key} partKey={key} onEdit={onEditSection} onHide={onHide} highlighted={highlight === key}>
      {children}
    </Part>
  )
  /** An optional section: shown, or (in the editor only) a slim bar to bring it back. */
  const optional = <K extends BeforeMenuSection | AfterMenuSection>(section: { key: K; visible: boolean }, children: ReactNode) => {
    if (section.visible) return part(section.key, children, onToggleSection ? () => onToggleSection(section.key, false) : undefined)
    if (!onToggleSection) return null
    return (
      <div
        key={section.key}
        data-storefront-section={section.key}
        className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground"
      >
        <span>
          <span className="font-medium text-foreground">{PART_LABELS[section.key][0].toUpperCase() + PART_LABELS[section.key].slice(1)}</span> · hidden from
          shoppers
        </span>
        <button type="button" onClick={() => onToggleSection(section.key, true)} className="text-sm font-semibold text-primary hover:underline">
          Show
        </button>
      </div>
    )
  }
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
    const chosen = config.mosaic.tiles.flatMap((tile): ResolvedMosaicTile[] => {
      if (tile.type === 'media') {
        const media = mediaById.get(tile.mediaId)
        return media ? [{ type: 'media', media }] : []
      }
      const item = itemsById.get(tile.itemId)
      return item && itemImage(item) ? [{ type: 'item', item }] : []
    })
    const shown = new Set(carousel.flatMap((item) => {
      const image = itemImage(item)
      return image ? [image] : []
    }))
    const unseen = (list: readonly ResolvedMosaicTile[]) => list.filter((tile) => {
      const url = tile.type === 'media' ? tile.media.url : itemImage(tile.item)
      if (!url || shown.has(url)) return false
      shown.add(url)
      return true
    })
    if (config.mosaic.tiles.length > 0) return unseen(chosen)
    // Nothing arranged yet: the store's own photos and videos first, then pictured products not
    // already in the carousel. Only real media; never a placeholder.
    const inCarousel = new Set(carousel.map((item) => item.id))
    const products = groups
      .flatMap((group) => group.items)
      .filter((item) => !inCarousel.has(item.id) && canOrderItem(item) && itemImage(item))
    return unseen([
      ...data.media.map((media): ResolvedMosaicTile => ({ type: 'media', media })),
      ...products.map((item): ResolvedMosaicTile => ({ type: 'item', item })),
    ]).slice(0, AUTO_TILES)
  }, [config.mosaic.tiles, data.media, itemsById, carousel, groups])

  // Products already in the carousel aren't repeated in the Featured row.
  const featuredRow = useMemo(() => {
    const inCarousel = new Set(carousel.map((item) => item.id))
    return featured.filter((item) => !inCarousel.has(item.id))
  }, [featured, carousel])

  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0
  const shownGroups = useMemo(
    () =>
      searching
        ? groups
            .map((group) => ({ ...group, items: group.items.filter((item) => matchesMenuSearch(item, query)) }))
            .filter((group) => group.items.length > 0)
        : groups,
    [groups, query, searching],
  )
  const resultCount = shownGroups.reduce((sum, group) => sum + group.items.length, 0)
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0)
  const [barHeight, setBarHeight] = useState(104)
  const jumpOffset = stickyTop + barHeight + 8
  const activeId = useActiveSection(
    shownGroups.map((group) => group.id),
    scrollRoot,
    jumpOffset,
  )
  const jump = useCallback((id: string) => scrollToSection(id, scrollRoot, jumpOffset), [scrollRoot, jumpOffset])

  const shownBundles = useMemo(() => {
    const active = bundles.filter((bundle) => bundle.isActive !== false)
    const byId = new Map(active.map((bundle) => [bundle.id, bundle]))
    return resolveBundleIds(config.featured, active.map((bundle) => bundle.id)).map((id) => byId.get(id)!)
  }, [bundles, config.featured])

  const beforeMenu: Record<BeforeMenuSection, ReactNode> = {
    mosaic: <MediaMosaic products={carousel} tiles={tiles} storeName={store.name} />,
    announcements: <Announcements panels={config.announcements} itemsById={itemsById} />,
    bundles: <BundlesRow bundles={shownBundles} />,
    featured: <FeaturedRow items={featuredRow} />,
    categories: groups.length >= CATEGORY_TILES_MIN_SECTIONS ? <CategoryTiles groups={groups} onJump={jump} /> : null,
  }
  const afterMenu = {
    about: <AboutSection store={store} hours={data.hours} showMap={mode === 'live'} />,
    gallery: <GallerySection media={data.media} storeName={store.name} />,
    updates: updates ? <UpdatesSection>{updates}</UpdatesSection> : null,
  }

  return (
    <StorefrontProvider value={actions}>
      <div className={cn('sf-root', theme.className, className)} style={theme.style}>
        <div className="mx-auto w-full max-w-[92rem] space-y-8 px-[clamp(1rem,2.4vw,2.5rem)] pb-16 pt-6">
          {part('header', <BusinessHeader store={store} tagline={config.brand.tagline} logoUrl={store.imageUrl ?? null} />)}
          {commerce ? part('ordering', <OrderingStrip ordering={data.ordering} hours={data.hours} />) : null}

          {/* The menu bar sits high so every section is a tap away, and sticks for the rest of the page. */}
          <div className="space-y-8">
            {commerce && (groups.length > 1 || totalItems > 6) ? (
              <MenuBar
                groups={shownGroups}
                query={query}
                onQuery={setQuery}
                activeId={activeId}
                onJump={jump}
                onHeight={setBarHeight}
              />
            ) : null}

            {searching ? (
              <p className="text-sm text-muted-foreground" role="status">
                {resultCount === 0
                  ? `Nothing on the menu matches “${query.trim()}”.`
                  : `${resultCount} ${resultCount === 1 ? 'item matches' : 'items match'} “${query.trim()}”`}
              </p>
            ) : (
              config.sections.beforeMenu.map((section) => optional(section, beforeMenu[section.key]))
            )}

            {commerce ? part(
              'menu',
              groups.length > 0 ? (
                <MenuSections
                  groups={shownGroups}
                  presentation={config.presentation}
                  jumpOffset={jumpOffset}
                  large={!searching && totalItems > LARGE_CATALOG_ITEMS}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nothing on the menu right now. Check back soon.
                </p>
              ),
            ) : null}

            {searching
              ? null
              : config.sections.afterMenu.map((section) => optional(section, afterMenu[section.key]))}
          </div>

          {commerce && mode === 'live' ? <CartBar storeId={store.id} /> : null}
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
function Part({ partKey, onEdit, onHide, highlighted, children }: {
  readonly partKey: StorefrontPartKey
  readonly onEdit?: (key: StorefrontPartKey) => void
  readonly onHide?: () => void
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
      <div className="sf-part-edit absolute right-2 top-2 z-30 flex gap-1">
        {onHide ? (
          <button
            type="button"
            onClick={onHide}
            className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-md ring-1 ring-border"
          >
            Hide
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(partKey)}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-md"
        >
          Edit {PART_LABELS[partKey]}
        </button>
      </div>
    </div>
  )
}
