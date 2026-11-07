/**
 * What the page can show, before search and before the layout decides to mount a block.
 * Pure: the same inputs always pick the same products and bundles.
 */
import type { ItemResponse } from '@api/types'
import {
  FEATURED_DEFAULT_COUNT,
  resolveBundleIds,
  resolveFeaturedItemIds,
  type StorefrontConfig,
} from '@packages/shared/storefront'
import { groupItemsBySection, type MenuGroup, type MenuSection } from '@shared/lib/menu/menuSections'
import { canOrderItem } from './context'
import type { StorefrontBundle } from './components/Merchandising'
import { itemImage } from './components/ProductTile'
import { uniqueMenuProducts } from './uniqueMenuProducts'

export interface StorefrontCatalog {
  readonly itemsById: ReadonlyMap<string, ItemResponse>
  readonly groups: readonly MenuGroup<ItemResponse>[]
  readonly featuredRow: readonly ItemResponse[]
  readonly bundles: readonly StorefrontBundle[]
}

export function resolveStorefrontCatalog(input: {
  readonly items: readonly ItemResponse[]
  readonly sections: readonly MenuSection[]
  readonly bundles: readonly StorefrontBundle[]
  readonly config: StorefrontConfig
  readonly popularItemIds: readonly string[]
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
  const featuredRow = resolveFeaturedItemIds(input.config.featured, popularity, orderable, FEATURED_DEFAULT_COUNT).map(
    (id) => itemsById.get(id)!,
  )
  return {
    itemsById,
    groups,
    featuredRow,
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

function shownBundles(bundles: readonly StorefrontBundle[], config: StorefrontConfig): StorefrontBundle[] {
  const active = bundles.filter((bundle) => bundle.isActive !== false)
  const byId = new Map(active.map((bundle) => [bundle.id, bundle]))
  return resolveBundleIds(config.featured, active.map((bundle) => bundle.id)).map((id) => byId.get(id)!)
}
