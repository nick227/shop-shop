import type { RiverPost, StoreWithDistance } from '@api/types'
import { STORE_TYPE_GROUPS, STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { deliveryRank, type StoreFulfillment } from '@features/stores/fulfillmentStatus'
import { editorialFor } from './editorialMedia'
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
  readonly fulfillment?: StoreFulfillment
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
  readonly mediaAssets?: readonly { readonly url?: string | null; readonly kind?: string | null }[]
}

export interface StoryTile {
  readonly kind: 'story'
  readonly id: string
  readonly kicker?: string
  readonly title: string
  readonly body: string
  readonly image?: string
  readonly credit?: string
  readonly storeId?: string
  readonly storeName?: string
}

export interface StoreTile {
  readonly kind: 'store'
  readonly id: string
  readonly name: string
  readonly typeLabel: string
  readonly image?: string
  readonly credit?: string
  readonly distance?: number
  readonly store: DiscoveryStore
}

export interface ProductTile {
  readonly kind: 'product'
  readonly id: string
  readonly title: string
  readonly price: string
  readonly image?: string
  readonly credit?: string
  readonly storeId: string
  readonly storeName: string
  readonly item: DiscoveryItem
}

export type DiscoveryTile = StoryTile | StoreTile | ProductTile

function ownStorePhoto(store: DiscoveryStore): string | undefined {
  const media = store.mediaAssets?.find((asset) => asset.url && asset.kind !== 'VIDEO')?.url
  return realPhoto(media) ?? realPhoto(store.imageUrl)
}

function pictured(own: string | undefined, text: string, seed: string): { readonly image?: string; readonly credit?: string } {
  if (own) return { image: own }
  const editorial = editorialFor(text, seed)
  return editorial ? { image: editorial.url, credit: editorial.attribution } : {}
}

function productPicture(item: DiscoveryItem): { readonly image?: string; readonly credit?: string } {
  const media = item.mediaAssets?.find((asset) => asset.url && asset.kind !== 'VIDEO')?.url
  return pictured(realPhoto(item.imageUrl) ?? realPhoto(media), `${item.title} ${item.description ?? ''}`, item.id)
}

function variedDish(item: DiscoveryItem, used: Set<string>): { readonly image?: string; readonly credit?: string } {
  const media = item.mediaAssets?.find((asset) => asset.url && asset.kind !== 'VIDEO')?.url
  const own = realPhoto(item.imageUrl) ?? realPhoto(media)
  if (own) return { image: own }
  const text = `${item.title} ${item.description ?? ''}`
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const editorial = editorialFor(text, `${item.id}:${attempt}`)
    if (!editorial) return {}
    if (!used.has(editorial.url) || attempt === 3) {
      used.add(editorial.url)
      return { image: editorial.url, credit: editorial.attribution }
    }
  }
  return {}
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
  if (browse === 'arts' || browse === 'outdoors') return false
  const group = STORE_TYPE_GROUPS[browse.toUpperCase()]
  if (!group) return true
  const type = merchantType(store)
  return Boolean(type && group.includes(type))
}

function textHit(text: string, query: string): boolean {
  return !query || text.toLowerCase().includes(query)
}

function money(price: string | number): string {
  const amount = typeof price === 'number' ? price : Number.parseFloat(price)
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : ''
}

function storyFromPost(post: RiverPost): StoryTile | undefined {
  const body = post.content?.trim()
  if (!body) return undefined
  const media = (post.mediaUrls ?? post.media)?.find((item) => item.url)?.url
  const picture = pictured(realPhoto(media), `${post.storeName ?? ''} ${body}`, post.id)
  return {
    kind: 'story',
    id: `post-${post.id}`,
    kicker: post.storeName ? `From ${post.storeName}` : 'Local story',
    title: post.storeName ?? 'Notice',
    body,
    image: picture.image,
    credit: picture.credit,
    storeId: post.storeId,
    storeName: post.storeName,
  }
}

const TEST_ARTIFACT_STORE =
  /^(Test Store [0-9a-f-]{8}|Multi Store \d+|Not Austin In Name|First Store|Second Store|Vendor Restaurant|Admin Restaurant|Empty Store|Corner Market QA|Seed Bistro|River Market Kitchen|Duval Corner Market|Northside Kitchen)|(\s(West Campus|Hyde Park|Hancock|Georgian Acres|Windsor Park|North Central|North Loop|Allandale)(\s+\d+)?)$/i

export function composeDiscovery(input: {
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly DiscoveryItem[]
  readonly stories: readonly RiverPost[]
  readonly browse: string
  readonly query: string
  /** Delivery-ready shops, and their products, sort ahead. Nothing is removed. */
  readonly deliveryFirst?: boolean
}): {
  readonly hero?: StoreTile
  readonly stories: readonly StoryTile[]
  readonly tiles: readonly DiscoveryTile[]
  readonly places: readonly DiscoveryStore[]
  readonly storeTiles: readonly StoreTile[]
  readonly nearest: readonly StoreTile[]
} {
  const q = input.query.trim().toLowerCase()
  const rawStores = input.stores as readonly DiscoveryStore[]
  const nonArtifactStores = rawStores.filter((store) => !TEST_ARTIFACT_STORE.test(store.name.trim()))
  const candidateStores = nonArtifactStores.length > 0 ? nonArtifactStores : rawStores
  const categoryStores = candidateStores.filter((store) => inVertical(store, input.browse))
  const categoryById = new Map(categoryStores.map((store) => [store.id, store]))
  const deliveryOrder = (storeId: string) => (input.deliveryFirst ? deliveryRank(categoryById.get(storeId)?.fulfillment) : 0)
  const products = input.products
    .filter((item) => {
      if (!categoryById.has(item.storeId)) return false
      return textHit(`${item.title} ${item.description ?? ''}`, q)
    })
    .sort((a, b) => {
      const byDelivery = deliveryOrder(a.storeId) - deliveryOrder(b.storeId)
      if (byDelivery !== 0) return byDelivery
      const aPhoto = productPicture(a).image ? 1 : 0
      const bPhoto = productPicture(b).image ? 1 : 0
      return bPhoto - aPhoto
    })

  const neighborStories = input.stories.map(storyFromPost).filter((story): story is StoryTile => {
    if (!story?.storeId || !categoryById.has(story.storeId)) return false
    return textHit(`${story.title} ${story.body} ${story.storeName ?? ''}`, q)
  })
  const matchedStoreIds = new Set<string>([
    ...products.map((item) => item.storeId),
    ...neighborStories.flatMap((story) => (story.storeId ? [story.storeId] : [])),
  ])
  const stores = categoryStores
    .filter((store) => textHit(`${store.name} ${store.description ?? ''}`, q) || matchedStoreIds.has(store.id))
    .sort((a, b) => {
      const byDelivery = deliveryOrder(a.id) - deliveryOrder(b.id)
      if (byDelivery !== 0) return byDelivery
      const aPhoto = ownStorePhoto(a) ? 1 : 0
      const bPhoto = ownStorePhoto(b) ? 1 : 0
      if (aPhoto !== bPhoto) return bPhoto - aPhoto
      return (a.distance ?? 99) - (b.distance ?? 99)
    })
  const storeById = new Map(stores.map((store) => [store.id, store]))
  const storeTiles: StoreTile[] = stores.map((store) => {
    const own = ownStorePhoto(store)
    return {
      kind: 'store',
      id: store.id,
      name: store.name,
      typeLabel: typeLabel(store),
      image: own,
      distance: store.distance,
      store,
    }
  })
  const hero = storeTiles.find((tile) => tile.image) ?? storeTiles[0]
  const newest = [...stores].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .find((store) => store.description?.trim())
  const newestDescription = newest?.description?.trim()
  const opened: StoryTile | undefined = newest && newestDescription
    ? {
        kind: 'story',
        id: `opened-${newest.id}`,
        kicker: `From ${newest.name}`,
        title: newest.name,
        body: newestDescription,
        ...pictured(ownStorePhoto(newest), newestDescription, newest.id),
        storeId: newest.id,
        storeName: newest.name,
      }
    : undefined
  const seenStoryStores = new Set<string>()
  const stories: StoryTile[] = []
  const openedVisible = opened && textHit(`${opened.title} ${opened.body}`, q) && (!opened.storeId || storeById.has(opened.storeId))
    ? opened
    : undefined
  for (const candidate of [...neighborStories, openedVisible]) {
    if (!candidate) continue
    const key = candidate.storeId ?? candidate.id
    if (seenStoryStores.has(key)) continue
    seenStoryStores.add(key)
    stories.push(candidate)
    if (stories.length >= 4) break
  }

  const usedDishes = new Set<string>()
  const productTiles: ProductTile[] = products.slice(0, 16).map((item) => {
    const picture = variedDish(item, usedDishes)
    return {
      kind: 'product',
      id: item.id,
      title: item.title,
      price: money(item.price),
      image: picture.image,
      credit: picture.credit,
      storeId: item.storeId,
      storeName: storeById.get(item.storeId)?.name ?? 'Nearby shop',
      item,
    }
  })

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
  return { hero, stories, tiles, places: stores, storeTiles, nearest }
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
