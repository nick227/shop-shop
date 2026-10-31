import { useQuery } from '@tanstack/react-query'
import { addresses, carts, orders } from '@api/apiWrapper'
import { authFetch } from '@shared/lib/auth/authFetch'
import { useAuthStore } from '@stores/authStore'
import {
  usualLine,
  type HomeAddress,
  type HomeOrder,
  type SavedItem,
  type SavedStore,
} from './signedInSelect'

interface FavoriteItemRow {
  readonly item?: {
    readonly id?: string
    readonly title?: string
    readonly price?: string | number
    readonly imageUrl?: string
    readonly storeId?: string
    readonly store?: { readonly name?: string }
    readonly media?: readonly { readonly url?: string }[]
  }
}

interface FavoriteStoreRow {
  readonly store?: {
    readonly id?: string
    readonly name?: string
  }
}

export interface HomeFavorites {
  readonly items: readonly SavedItem[]
  readonly stores: readonly SavedStore[]
}

const EMPTY_FAVORITES: HomeFavorites = { items: [], stores: [] }

async function readFavorites(): Promise<HomeFavorites> {
  const [itemResponse, storeResponse] = await Promise.all([
    authFetch<{ favorites?: FavoriteItemRow[] }>('api/favorites/items'),
    authFetch<{ favorites?: FavoriteStoreRow[] }>('api/favorites/stores'),
  ])
  const itemBody = itemResponse.ok ? await itemResponse.json() : { favorites: [] }
  const storeBody = storeResponse.ok ? await storeResponse.json() : { favorites: [] }
  const items: SavedItem[] = []
  for (const row of itemBody.favorites ?? []) {
    const item = row.item
    if (!item?.id || !item.title || !item.storeId) continue
    items.push({
      id: item.id,
      title: item.title,
      price: item.price,
      storeId: item.storeId,
      storeName: item.store?.name,
      imageUrl: item.media?.find((media) => media.url)?.url ?? item.imageUrl,
    })
  }
  const stores: SavedStore[] = []
  for (const row of storeBody.favorites ?? []) {
    if (!row.store?.id || !row.store.name) continue
    stores.push({ id: row.store.id, name: row.store.name })
  }
  return { items, stores }
}

export function useSignedInHome() {
  const userId = useAuthStore((state) => state.user?.id)
  const role = useAuthStore((state) => state.user?.role)
  const enabled = Boolean(userId) && role === 'USER'

  const orderQuery = useQuery({
    queryKey: ['home-orders', userId],
    enabled,
    queryFn: async () => {
      const rows = (await orders.list({ limit: '12' })) as unknown as HomeOrder[]
      const recent = rows.slice(0, 8)
      const filled = await Promise.all(recent.map(async (order) => {
        if (!order.cartId) return order
        try {
          const cart = await carts.getById(order.cartId)
          return { ...order, items: (cart as { items?: unknown }).items }
        } catch {
          return order
        }
      }))
      return [...filled, ...rows.slice(8)]
    },
  })
  const addressQuery = useQuery({
    queryKey: ['home-addresses', userId],
    enabled,
    queryFn: async () => (await addresses.list()) as unknown as HomeAddress[],
  })
  const favoriteQuery = useQuery({
    queryKey: ['home-favorites', userId],
    enabled,
    queryFn: readFavorites,
  })

  const orderRows = orderQuery.data ?? []
  return {
    enabled,
    orders: orderRows,
    addresses: addressQuery.data ?? [],
    favorites: favoriteQuery.data ?? EMPTY_FAVORITES,
    usual: usualLine(orderRows),
  }
}
