import type { ItemResponse, StoreWithDistance } from '@api/types'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { formatCurrency } from '@shared/lib/utils/format'
import { resolvePrimaryImageUrl } from '@shared/lib/utils/image'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { hasPhoto } from './selectHome'
import type { RecentView } from './recentViews'

export interface HomeOrder {
  readonly id: string
  readonly storeId: string
  readonly cartId?: string | null
  readonly createdAt?: string
  readonly items?: unknown
}

export interface HomeAddress {
  readonly line1?: string
  readonly postalCode?: string
  readonly isDefault?: boolean
  readonly geo?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
}

export interface SavedItem {
  readonly id: string
  readonly title: string
  readonly price?: string | number
  readonly storeId: string
  readonly storeName?: string
  readonly imageUrl?: string
}

export interface SavedStore {
  readonly id: string
  readonly name: string
}

interface OrderLine {
  readonly itemId: string
  readonly title: string
  readonly at: number
  readonly storeId: string
}

const REPEAT_WINDOW_HOURS = 2
const DEFAULT_DELIVERY_MILES = 25

function linesOf(order: HomeOrder): OrderLine[] {
  const raw = typeof order.items === 'string' ? parseJson(order.items) : order.items
  if (!Array.isArray(raw)) return []
  const at = Date.parse(order.createdAt ?? '')
  const when = Number.isFinite(at) ? at : 0
  const lines: OrderLine[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const record = row as { itemId?: unknown; titleSnapshot?: unknown; title?: unknown }
    const itemId = typeof record.itemId === 'string' ? record.itemId : ''
    const title = typeof record.titleSnapshot === 'string'
      ? record.titleSnapshot
      : typeof record.title === 'string'
        ? record.title
        : ''
    if (!itemId || !title) continue
    lines.push({ itemId, title, at: when, storeId: order.storeId })
  }
  return lines
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return undefined
  }
}

function productPhoto(products: readonly ItemResponse[], itemId: string): string | undefined {
  const match = products.find((item) => item.id === itemId)
  if (!match) return undefined
  const withImage = match as ItemResponse & { imageUrl?: string }
  return resolvePrimaryImageUrl(withImage.imageUrl, match.mediaAssets) ?? undefined
}

function storeName(stores: readonly StoreWithDistance[], storeId: string): string | undefined {
  return stores.find((store) => store.id === storeId)?.name
}

export function orderAgainViews(
  orders: readonly HomeOrder[],
  stores: readonly StoreWithDistance[],
  products: readonly ItemResponse[],
): RecentView[] {
  const seen = new Set<string>()
  const views: RecentView[] = []
  const lines = orders.flatMap(linesOf).sort((a, b) => b.at - a.at)
  for (const line of lines) {
    if (seen.has(line.itemId)) continue
    seen.add(line.itemId)
    const product = products.find((item) => item.id === line.itemId)
    views.push({
      id: line.itemId,
      kind: 'item',
      title: line.title,
      imageUrl: productPhoto(products, line.itemId),
      subtitle: [product ? formatCurrency(product.price) : undefined, storeName(stores, line.storeId)]
        .filter(Boolean)
        .join(' · '),
      path: getItemRouteSimple({ id: line.itemId, title: line.title }),
    })
    if (views.length === 8) break
  }
  return views
}

export function savedViews(
  items: readonly SavedItem[],
  savedStores: readonly SavedStore[],
  stores: readonly StoreWithDistance[],
): RecentView[] {
  const itemViews: RecentView[] = items.slice(0, 8).map((item) => ({
    id: item.id,
    kind: 'item',
    title: item.title,
    imageUrl: item.imageUrl,
    subtitle: [item.price !== undefined ? formatCurrency(item.price) : undefined, item.storeName]
      .filter(Boolean)
      .join(' · '),
    path: getItemRouteSimple({ id: item.id, title: item.title }),
  }))
  const storeViews: RecentView[] = savedStores.slice(0, 6).map((saved) => {
    const known = stores.find((store) => store.id === saved.id)
    return {
      id: saved.id,
      kind: 'store' as const,
      title: saved.name,
      imageUrl: known && hasPhoto(known) ? getStoreImageUrl(known, 'square') : undefined,
      path: getStoreRoute({ id: saved.id, name: saved.name }),
    }
  })
  return [...itemViews, ...storeViews].slice(0, 10)
}

export function usualLine(orders: readonly HomeOrder[], now = new Date()): string | undefined {
  const counts = new Map<string, number>()
  for (const order of orders) {
    const at = Date.parse(order.createdAt ?? '')
    if (!Number.isFinite(at)) continue
    const then = new Date(at)
    const gap = Math.abs(then.getHours() - now.getHours())
    if (Math.min(gap, 24 - gap) > REPEAT_WINDOW_HOURS) continue
    for (const line of linesOf(order)) {
      counts.set(line.title, (counts.get(line.title) ?? 0) + 1)
    }
  }
  let best: string | undefined
  let score = 1
  for (const [title, count] of counts) {
    if (count > score) {
      score = count
      best = title
    }
  }
  return best ? `You usually get ${best} around now.` : undefined
}

function doorPoint(address: HomeAddress | undefined): { lat: number; lng: number } | undefined {
  const geo = address?.geo
  if (!geo) return undefined
  const lat = geo.lat ?? geo.latitude
  const lng = geo.lng ?? geo.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined
  return { lat, lng }
}

function milesBetween(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const rad = Math.PI / 180
  const dLat = (toLat - fromLat) * rad
  const dLng = (toLng - fromLng) * rad
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(fromLat * rad) * Math.cos(toLat * rad) * Math.sin(dLng / 2) ** 2
  return 3959 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function deliveryAddress(addresses: readonly HomeAddress[]): HomeAddress | undefined {
  return addresses.find((address) => address.isDefault) ?? addresses[0]
}

export function deliversToDoor(
  stores: readonly StoreWithDistance[],
  address: HomeAddress | undefined,
): { readonly store: StoreWithDistance; readonly miles: number }[] {
  const door = doorPoint(address)
  if (!door) return []
  const rows: { store: StoreWithDistance; miles: number }[] = []
  for (const store of stores) {
    if (!store.deliveryEnabled) continue
    const lat = Number(store.latitude)
    const lng = Number(store.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const cap = Number.parseFloat(String(store.deliveryDistance ?? ''))
    const limit = Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_DELIVERY_MILES
    const miles = milesBetween(door.lat, door.lng, lat, lng)
    if (miles <= limit) rows.push({ store, miles })
  }
  return rows.sort((a, b) => a.miles - b.miles).slice(0, 6)
}
