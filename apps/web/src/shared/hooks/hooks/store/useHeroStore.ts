/**
 * Newest published store for marketing hero (API order: createdAt desc).
 */
import { useQuery } from '@tanstack/react-query'
import { stores } from '@api/apiWrapper'
import type { StoreWithDistance } from '@api/types'

type StoreWithMedia = StoreWithDistance & {
  readonly mediaAssets?: readonly { readonly url: string; readonly kind?: string }[]
}

function hasStoreImage(store: StoreWithMedia): boolean {
  if (store.imageUrl?.trim()) return true
  return Boolean(store.mediaAssets?.some((asset) => asset.url?.trim() && (asset.kind === 'IMAGE' || !asset.kind)))
}

export function useHeroStore() {
  return useQuery<StoreWithDistance | null>({
    queryKey: ['hero-store'],
    queryFn: async () => {
      const envelope = await stores.listPage({ limit: '1', page: '1' })
      const first = envelope.data[0] as unknown as StoreWithMedia | undefined
      if (!first) return null
      if (hasStoreImage(first)) return first

      try {
        const detailed = await stores.getById(first.id) as unknown as StoreWithMedia
        return {
          ...first,
          ...detailed,
        }
      } catch {
        return first
      }
    },
    staleTime: 10 * 60 * 1000,
  })
}
