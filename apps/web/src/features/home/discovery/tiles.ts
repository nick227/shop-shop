import type { RiverPost, StoreWithDistance } from '@api/types'
import { STORE_TYPE_GROUPS, STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { realPhoto } from './photo'

export interface DiscoveryStore {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly imageUrl?: string
  readonly latitude?: number | string
  readonly longitude?: number | string
  readonly distance?: number
  readonly createdAt?: string
  readonly storeType?: string | null
  readonly deliveryEnabled?: boolean
  readonly pickupEnabled?: boolean
  readonly mediaAssets?: readonly { readonly url: string; readonly kind?: string }[]
}

export interface DiscoveryItem {
  readonly id: string
  readonly title: string
  readonly price: string | number
  readonly storeId: string
  readonly imageUrl?: string
  readonly description?: string
  readonly isSoldOut?: boolean
  readonly isActive?: boolean
}

export interface StoryTile {
  readonly kind: 'story'
  readonly id: string
  readonly kicker: string
  readonly title: string
  readonly body: string
  readonly image?: string
  readonly storeId?: string
  readonly storeName?: string
}

export interface StoreTile {
  readonly kind: 'store'
  readonly id: string
  readonly name: string
  readonly typeLabel: string
  readonly image?: string
  readonly distance?: number
  readonly store: DiscoveryStore
}

export interface ProductTile {
  readonly kind: 'product'
  readonly id: string
  readonly title: string
  readonly price: string
  readonly image?: string
  readonly storeId: string
  readonly storeName: string
  readonly item: DiscoveryItem
}

export type DiscoveryTile = StoryTile | StoreTile | ProductTile

function storePhoto(store: DiscoveryStore): string | undefined {
  const media = store.mediaAssets?.find((asset) => asset.url)?.url
  return realPhoto(media) ?? realPhoto(store.imageUrl)
}

function merchantType(store: DiscoveryStore): string | undefined {
  if (store.storeType) return store.storeType
  const text = `${store.name} ${store.description ?? ''}`.toLowerCase()
  if (/grocery|produce/.test(text)) return 'GROCERY'
  if (/convenience|corner store/.test(text)) return 'CONVENIENCE'
  if (/\b(retail|boutique)\b/.test(text)) return 'RETAIL'
  if (/bakery|sweet tooth|dough/.test(text)) return 'BAKERY'
  if (/coffee|grind|roast/.test(text)) return 'COFFEE'
  if (/taco|kitchen|burger|bbq|smoke|thai|sushi|pizza|cafe|deli|grill|express|truck|heaven/.test(text)) return 'RESTAURANT'
  return undefined
}

function typeLabel(store: DiscoveryStore): string {
  const type = merchantType(store)
  if (!type) return 'Shop'
  return STORE_TYPE_LABEL[type] ?? 'Shop'
}

function inVertical(store: DiscoveryStore, browse: string): boolean {
  if (!browse) return true
  const group = STORE_TYPE_GROUPS[browse.toUpperCase()]
  if (!group) return true
  const type = merchantType(store)
  return Boolean(type && group.includes(type))
}

function money(price: string | number): string {
  const amount = typeof price === 'number' ? price : Number.parseFloat(price)
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : ''
}

function storyFromPost(post: RiverPost): StoryTile | undefined {
  const body = post.content?.trim()
  if (!body) return undefined
  const media = (post.mediaUrls ?? post.media)?.find((item) => item.url)?.url
  return {
    kind: 'story',
    id: `post-${post.id}`,
    kicker: 'From your neighbors',
    title: post.storeName ?? 'A note from the block',
    body,
    image: realPhoto(media),
    storeId: post.storeId,
    storeName: post.storeName,
  }
}

export function composeDiscovery(input: {
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly DiscoveryItem[]
  readonly stories: readonly RiverPost[]
  readonly browse: string
  readonly query: string
}): {
  readonly hero?: StoreTile
  readonly stories: readonly StoryTile[]
  readonly tiles: readonly DiscoveryTile[]
  readonly places: readonly DiscoveryStore[]
  readonly nearest: readonly StoreTile[]
} {
  const q = input.query.trim().toLowerCase()
  const stores = (input.stores as readonly DiscoveryStore[]).filter((store) => {
    if (!inVertical(store, input.browse)) return false
    if (!q) return true
    return `${store.name} ${store.description ?? ''}`.toLowerCase().includes(q)
  })
  const storeById = new Map(stores.map((store) => [store.id, store]))
  const products = input.products.filter((item) => {
    const store = storeById.get(item.storeId)
    if (!store) return false
    if (!q) return true
    return `${item.title} ${item.description ?? ''} ${store.name}`.toLowerCase().includes(q)
  })

  const storeTiles: StoreTile[] = stores.map((store) => ({
    kind: 'store',
    id: store.id,
    name: store.name,
    typeLabel: typeLabel(store),
    image: storePhoto(store),
    distance: store.distance,
    store,
  }))
  const hero = storeTiles.find((tile) => tile.image) ?? storeTiles[0]
  const newest = [...stores].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0]
  const opened: StoryTile | undefined = newest
    ? {
        kind: 'story',
        id: `opened-${newest.id}`,
        kicker: 'Just opened',
        title: newest.name,
        body: newest.description?.trim() || `${typeLabel(newest)} now serving your delivery area.`,
        image: storePhoto(newest),
        storeId: newest.id,
        storeName: newest.name,
      }
    : undefined
  const neighborStories = input.stories.map(storyFromPost).filter((story): story is StoryTile => Boolean(story))
  const stories = [opened, ...neighborStories].filter((story): story is StoryTile => Boolean(story)).slice(0, 3)

  const productTiles: ProductTile[] = products.slice(0, 16).map((item) => ({
    kind: 'product',
    id: item.id,
    title: item.title,
    price: money(item.price),
    image: realPhoto(item.imageUrl),
    storeId: item.storeId,
    storeName: storeById.get(item.storeId)?.name ?? 'Nearby shop',
    item,
  }))

  const tiles: DiscoveryTile[] = []
  const restStores = storeTiles.filter((tile) => tile.id !== hero?.id)
  const max = Math.max(restStores.length, productTiles.length, stories.length)
  for (let index = 0; index < max && tiles.length < 18; index += 1) {
    const product = productTiles[index]
    const store = restStores[index]
    const story = stories[index]
    if (product) tiles.push(product)
    if (store) tiles.push(store)
    if (story && index === 0) tiles.push(story)
  }
  const nearest = [...storeTiles].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99)).slice(0, 3)
  return { hero, stories, tiles, places: stores, nearest }
}

export function mapPoints(stores: readonly DiscoveryStore[]): { id: string; name: string; latitude: number; longitude: number }[] {
  const points = []
  for (const store of stores) {
    const latitude = Number(store.latitude)
    const longitude = Number(store.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
    points.push({ id: store.id, name: store.name, latitude, longitude })
  }
  return points
}
