import type { ItemResponse, StoreWithDistance } from '@api/types'
import { realPhoto } from './photo'
import { orderAgainViews, savedViews, type HomeOrder, type SavedItem, type SavedStore } from '../neighborhood/signedInSelect'
import type { RecentView } from '../neighborhood/recentViews'

/** Recency first, then orders, then saves. Later ranking can replace this order. */
export function shoppingFeed(input: {
  readonly views: readonly RecentView[]
  readonly orders: readonly HomeOrder[]
  readonly savedItems: readonly SavedItem[]
  readonly savedStores: readonly SavedStore[]
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly ItemResponse[]
}): RecentView[] {
  const ordered = [
    ...input.views,
    ...orderAgainViews(input.orders, input.stores, input.products),
    ...savedViews(input.savedItems, input.savedStores, input.stores),
  ]
  const seen = new Set<string>()
  const feed: RecentView[] = []
  for (const view of ordered) {
    const key = `${view.kind}:${view.id}`
    if (seen.has(key)) continue
    seen.add(key)
    feed.push({ ...view, imageUrl: realPhoto(view.imageUrl) })
    if (feed.length === 8) break
  }
  return feed
}
