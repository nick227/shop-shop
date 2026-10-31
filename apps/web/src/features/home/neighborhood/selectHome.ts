import type { ItemResponse, StoreWithDistance } from '@api/types'
import { STORE_TYPE_GROUPS, STORE_TYPE_LABEL } from '@features/search/config/storeTypes'
import { resolvePrimaryImageUrl } from '@shared/lib/utils/image'
import { preferredSlug, type HomeTaste } from './taste'

export function readStoreType(store: StoreWithDistance): string | undefined {
  const value = (store as StoreWithDistance & { storeType?: string | null }).storeType
  return value ?? undefined
}

export function storeTypeLabel(store: StoreWithDistance): string {
  const type = readStoreType(store)
  if (!type) return 'Store'
  return STORE_TYPE_LABEL[type] ?? 'Store'
}

export function verticalSlugForStore(store: StoreWithDistance): string | undefined {
  const type = readStoreType(store)
  if (!type) return undefined
  for (const [vertical, types] of Object.entries(STORE_TYPE_GROUPS)) {
    if (types.includes(type)) return vertical.toLowerCase()
  }
  return undefined
}

export function hasPhoto(store: StoreWithDistance): boolean {
  const withMedia = store as StoreWithDistance & {
    mediaAssets?: readonly { readonly url: string; readonly kind?: string }[]
  }
  const media = withMedia.mediaAssets?.map((asset) => ({
    url: asset.url,
    kind: asset.kind ?? 'IMAGE',
  }))
  return Boolean(resolvePrimaryImageUrl(store.imageUrl, media))
}

function takeUnused(stores: readonly StoreWithDistance[], count: number, used: Set<string>) {
  const picked: StoreWithDistance[] = []
  for (const store of stores) {
    if (used.has(store.id)) continue
    used.add(store.id)
    picked.push(store)
    if (picked.length === count) break
  }
  return picked
}

export interface HomeSelection {
  readonly hero: StoreWithDistance | undefined
  readonly personal: readonly StoreWithDistance[]
  readonly personalSlug: string | undefined
  readonly mosaic: readonly StoreWithDistance[]
  readonly products: readonly ItemResponse[]
  readonly productsAreLocal: boolean
}

export function selectHome(
  stores: readonly StoreWithDistance[],
  products: readonly ItemResponse[],
  taste: HomeTaste,
  hasPlace: boolean,
): HomeSelection {
  const used = new Set<string>()
  const hero = stores.find(hasPhoto) ?? stores[0]
  if (hero) used.add(hero.id)

  const personalSlug = preferredSlug(taste)
  const vertical = personalSlug?.toUpperCase()
  const personalPool = vertical
    ? stores.filter((store) => {
        const type = readStoreType(store)
        return Boolean(type && STORE_TYPE_GROUPS[vertical]?.includes(type))
      })
    : []
  const personal = personalPool.length > 0 ? takeUnused(personalPool, 6, used) : []
  const mosaic = takeUnused(stores, 3, used)

  const nearbyIds = new Set(stores.map((store) => store.id))
  const localProducts = hasPlace ? products.filter((item) => nearbyIds.has(item.storeId)) : []
  const productsAreLocal = localProducts.length > 0
  const shelf = (productsAreLocal ? localProducts : products).slice(0, 10)

  return {
    hero,
    personal: personalSlug && personal.length > 0 ? personal : [],
    personalSlug: personal.length > 0 ? personalSlug : undefined,
    mosaic,
    products: shelf,
    productsAreLocal,
  }
}

export function momentLine(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 11) return 'The block is waking up.'
  if (hour < 15) return 'Lunch is close.'
  if (hour < 17) return 'The afternoon market is open.'
  if (hour < 21) return 'Dinner is on your street.'
  return 'A few doors are still open.'
}
