/**
 * What the page can show, before search and before the layout decides to mount a block.
 * Pure: the same inputs always pick the same products, tiles, and bundles.
 */
import type { ItemResponse } from '@api/types'
import {
  FEATURED_DEFAULT_COUNT,
  resolveBundleIds,
  resolveFeaturedItemIds,
  type StorefrontConfig,
} from '@packages/shared/storefront'
import { groupItemsBySection, type MenuGroup, type MenuSection } from '@shared/lib/menu/menuSections'
import type { StorefrontMedia } from './api'
import { canOrderItem } from './context'
import type { ResolvedMosaicTile } from './components/MediaMosaic'
import type { StorefrontBundle } from './components/Merchandising'
import { itemImage } from './components/ProductTile'
import { uniqueMenuProducts } from './uniqueMenuProducts'

const CAROUSEL_COUNT = 5
/** Side tiles the mosaic fills on its own when the vendor hasn't arranged any. */
const AUTO_TILES = 4

export interface StorefrontCatalog {
  readonly itemsById: ReadonlyMap<string, ItemResponse>
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly carousel: readonly ItemResponse[]
  readonly tiles: readonly ResolvedMosaicTile[]
  readonly featuredRow: readonly ItemResponse[]
  readonly bundles: readonly StorefrontBundle[]
}

export function resolveStorefrontCatalog(input: {
  readonly items: readonly ItemResponse[]
  readonly sections: readonly MenuSection[]
  readonly bundles: readonly StorefrontBundle[]
  readonly config: StorefrontConfig
  readonly popularItemIds: readonly string[]
  readonly media: readonly StorefrontMedia[]
}): StorefrontCatalog {
  const menuItems = uniqueMenuProducts(input.items)
  const itemsById = new Map(menuItems.map((item) => [item.id, item]))
  const groups = visibleGroups(menuItems, input.sections)
  const orderable = (id: string) => {
    const item = itemsById.get(id)
    return !!item && canOrderItem(item)
  }
  const pictured = groups.flatMap((group) => group.items).filter((item) => itemImage(item)).map((item) => item.id)
  const popularity = [...new Set([...input.popularItemIds, ...pictured])]
  const featured = resolveFeaturedItemIds(input.config.featured, popularity, orderable, FEATURED_DEFAULT_COUNT).map((id) => itemsById.get(id)!)
  const carousel = carouselProducts(input.config, featured, itemsById)
  return {
    itemsById,
    groups,
    carousel,
    tiles: mosaicTiles(input.config, input.media, itemsById, carousel, groups),
    featuredRow: featured.filter((item) => !carousel.some((shown) => shown.id === item.id)),
    bundles: shownBundles(input.bundles, input.config),
  }
}

/** Items of a hidden section stay off the page, including ones returned only to the store's team. */
function visibleGroups(menuItems: readonly ItemResponse[], sections: readonly MenuSection[]): MenuGroup<ItemResponse>[] {
  const visible = new Set(sections.filter((section) => section.isVisible).map((section) => section.id))
  const shown = menuItems.filter((item) => !item.sectionId || visible.has(item.sectionId))
  return groupItemsBySection(shown, sections.filter((section) => section.isVisible), {
    unsectionedName: visible.size > 0 ? 'More' : 'Menu',
  })
}

/** Popular pictured items, with the vendor's lead product first. */
function carouselProducts(
  config: StorefrontConfig,
  featured: readonly ItemResponse[],
  itemsById: ReadonlyMap<string, ItemResponse>,
): ItemResponse[] {
  const lead = config.mosaic.featuredItemId ? itemsById.get(config.mosaic.featuredItemId) : undefined
  const pool = [...(lead ? [lead] : []), ...featured].filter((item) => itemImage(item))
  return [...new Map(pool.map((item) => [item.id, item])).values()].slice(0, CAROUSEL_COUNT)
}

function mosaicTiles(
  config: StorefrontConfig,
  media: readonly StorefrontMedia[],
  itemsById: ReadonlyMap<string, ItemResponse>,
  carousel: readonly ItemResponse[],
  groups: readonly MenuGroup<ItemResponse>[],
): ResolvedMosaicTile[] {
  const mediaById = new Map(media.map((asset) => [asset.id, asset]))
  const chosen = config.mosaic.tiles.flatMap((tile): ResolvedMosaicTile[] => {
    if (tile.type === 'media') {
      const asset = mediaById.get(tile.mediaId)
      return asset ? [{ type: 'media', media: asset }] : []
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
  const inCarousel = new Set(carousel.map((item) => item.id))
  const products = groups
    .flatMap((group) => group.items)
    .filter((item) => !inCarousel.has(item.id) && canOrderItem(item) && itemImage(item))
  return unseen([
    ...media.map((asset): ResolvedMosaicTile => ({ type: 'media', media: asset })),
    ...products.map((item): ResolvedMosaicTile => ({ type: 'item', item })),
  ]).slice(0, AUTO_TILES)
}

function shownBundles(bundles: readonly StorefrontBundle[], config: StorefrontConfig): StorefrontBundle[] {
  const active = bundles.filter((bundle) => bundle.isActive !== false)
  const byId = new Map(active.map((bundle) => [bundle.id, bundle]))
  return resolveBundleIds(config.featured, active.map((bundle) => bundle.id)).map((id) => byId.get(id)!)
}
