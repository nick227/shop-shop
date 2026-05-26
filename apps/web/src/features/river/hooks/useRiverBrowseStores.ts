import { useQuery } from '@tanstack/react-query'
import type { StoreResponse } from '@api/types'
import type { StoreSearchResult, UnifiedSearchResponse } from '@features/search/hooks/useUnifiedSearchApi'

export interface RiverBrowseStoresParams {
  readonly storeTypeFilter: string
  readonly nearMe: boolean
  readonly latitude: number | undefined
  readonly longitude: number | undefined
}

type StoreWithMedia = StoreResponse & {
  readonly distance?: number
  readonly imageUrl?: string | null
  readonly mediaAssets?: readonly { readonly url: string; readonly kind?: string }[]
  readonly tags?: readonly { readonly slug: string; readonly label: string; readonly category: string }[]
  readonly storeType?: string | null
  readonly priceRange?: string | null
  readonly addressStreet?: string | null
  readonly addressCity?: string | null
  readonly addressState?: string | null
  readonly addressZip?: string | null
}

function storeToSearchResult(store: StoreWithMedia): StoreSearchResult {
  const primaryMedia = store.mediaAssets?.find((asset) => asset.url?.trim() && (asset.kind === 'IMAGE' || !asset.kind))
  return {
    id: store.id,
    name: store.name,
    description: store.description ?? undefined,
    imageUrl: primaryMedia?.url ?? store.imageUrl ?? undefined,
    distance: store.distance,
    prepTimeMin: store.prepTimeMin ?? 30,
    isOpen: store.isPublished ?? true,
    category: store.storeType ?? 'GENERAL',
    priceRange: store.priceRange ?? undefined,
    deliveryEnabled: store.deliveryEnabled ?? false,
    pickupEnabled: store.pickupEnabled ?? false,
    latitude: store.latitude == null ? undefined : Number(store.latitude),
    longitude: store.longitude == null ? undefined : Number(store.longitude),
    createdAt: store.createdAt,
    tags: store.tags?.map((tag) => ({
      slug: tag.slug,
      label: tag.label,
      category: tag.category,
    })) ?? [],
    address: store.addressCity || store.addressState || store.addressZip || store.addressStreet
      ? {
          street: store.addressStreet ?? '',
          city: store.addressCity ?? '',
          state: store.addressState ?? '',
          zip: store.addressZip ?? '',
        }
      : undefined,
  }
}

async function fetchFallbackStores(params: RiverBrowseStoresParams): Promise<UnifiedSearchResponse> {
  const sp = new URLSearchParams()
  sp.set('page', '1')
  sp.set('limit', '50')
  sp.set('isPublished', 'true')
  if (params.storeTypeFilter) sp.set('storeType', params.storeTypeFilter)
  if (params.nearMe && params.latitude != null && params.longitude != null) {
    sp.set('latitude', String(params.latitude))
    sp.set('longitude', String(params.longitude))
    sp.set('radiusMiles', '25')
  }

  try {
    const response = await fetch(`/api/stores?${sp.toString()}`)
    if (!response.ok) {
      return {
        query: '',
        interpreted: {},
        sections: {
          stores: { total: 0, results: [] },
          products: { total: 0, results: [] },
        },
      }
    }

    const body = await response.json() as { data?: StoreWithMedia[] } | StoreWithMedia[]
    const stores = Array.isArray(body) ? body : body.data ?? []
    const results = stores.map(storeToSearchResult)

    return {
      query: '',
      interpreted: {},
      sections: {
        stores: { total: results.length, results },
        products: { total: 0, results: [] },
      },
    }
  } catch {
    return {
      query: '',
      interpreted: {},
      sections: {
        stores: { total: 0, results: [] },
        products: { total: 0, results: [] },
      },
    }
  }
}

export function useRiverBrowseStores(params: RiverBrowseStoresParams) {
  const { storeTypeFilter, nearMe, latitude, longitude } = params
  const geoReady = latitude != null && longitude != null
  const enabled = !nearMe || geoReady

  return useQuery<UnifiedSearchResponse, Error>({
    queryKey: ['river-browse-stores', storeTypeFilter || 'ALL', nearMe, latitude, longitude],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (storeTypeFilter) sp.set('storeType', storeTypeFilter)
      if (nearMe && latitude != null && longitude != null) {
        sp.set('latitude', String(latitude))
        sp.set('longitude', String(longitude))
        sp.set('radiusMiles', '25')
      }
      try {
        const response = await fetch(`/api/search/unified?${sp.toString()}`)
        if (!response.ok) {
          return fetchFallbackStores(params)
        }
        return response.json()
      } catch {
        return fetchFallbackStores(params)
      }
    },
    enabled,
    staleTime: 30_000,
  })
}
