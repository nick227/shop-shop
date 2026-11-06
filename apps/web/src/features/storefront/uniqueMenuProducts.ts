/**
 * One card per product on the storefront. Saving the same item again creates another row;
 * the editor preview and the public page share this so those copies are not shown side by side.
 */
import type { ItemResponse } from '@api/types'
import { itemImage } from './components/ProductTile'

function productIdentity(item: ItemResponse): string {
  const title = item.title.trim().replaceAll(/\s+/g, ' ').toLowerCase()
  if (!title) return item.id
  const price = Number(item.price)
  return `${title}\0${Number.isFinite(price) ? price : String(item.price)}`
}

/** A photo and a menu section beat a bare duplicate of the same name and price. */
function rank(item: ItemResponse): number {
  return (itemImage(item) ? 2 : 0) + (item.sectionId ? 1 : 0)
}

export function uniqueMenuProducts(items: readonly ItemResponse[]): ItemResponse[] {
  const chosen = new Map<string, ItemResponse>()
  const order: string[] = []
  for (const item of items) {
    const key = productIdentity(item)
    const current = chosen.get(key)
    if (!current) {
      chosen.set(key, item)
      order.push(key)
      continue
    }
    if (rank(item) >= rank(current)) chosen.set(key, item)
  }
  return order.map((key) => chosen.get(key)!)
}
