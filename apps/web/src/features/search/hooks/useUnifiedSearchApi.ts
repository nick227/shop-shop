/**
 * useUnifiedSearchApi - Hook for calling /api/search/unified
 */
import { useQuery } from '@tanstack/react-query'

export interface TagResult {
  slug: string
  label: string
  category: string
}

export interface UnifiedSearchRequest {
  q?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
  radiusMiles?: number
  storeType?: string
  priceRange?: string
  tags?: string[]
}

export interface UnifiedSearchResponse {
  query: string
  interpreted: {
    locationSuggestion?: {
      label: string
      city: string
      state: string
    }
  }
  sections: {
    stores: {
      total: number
      results: StoreSearchResult[]
    }
    products: {
      total: number
      results: ProductSearchResult[]
    }
  }
}

export interface StoreSearchResult {
  id: string
  name: string
  description?: string
  imageUrl?: string
  distance?: number
  rating?: number
  prepTimeMin: number
  isOpen: boolean
  category: string
  priceRange?: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  latitude?: number
  longitude?: number
  createdAt: string
  tags: TagResult[]
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export interface ProductSearchResult {
  id: string
  title: string
  description?: string
  imageUrl?: string
  price: number
  storeId: string
  storeName: string
  category: string
  available: boolean
  isSoldOut: boolean
  tags: TagResult[]
}

export function useUnifiedSearchApi(request: UnifiedSearchRequest) {
  return useQuery<UnifiedSearchResponse, Error>({
    queryKey: ['unified-search', request],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (request.q) params.append('q', request.q)
      if (request.city) params.append('city', request.city)
      if (request.state) params.append('state', request.state)
      if (request.zip) params.append('zip', request.zip)
      if (request.latitude) params.append('latitude', request.latitude.toString())
      if (request.longitude) params.append('longitude', request.longitude.toString())
      if (request.radiusMiles) params.append('radiusMiles', request.radiusMiles.toString())
      if (request.storeType) params.append('storeType', request.storeType)
      if (request.priceRange) params.append('priceRange', request.priceRange)
      if (request.tags?.length) params.append('tags', request.tags.join(','))

      const response = await fetch(`/api/search/unified?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      return response.json()
    },
    enabled: !!request.q || !!request.city || !!request.zip || !!request.latitude,
    staleTime: 30_000, // 30 seconds
  })
}
