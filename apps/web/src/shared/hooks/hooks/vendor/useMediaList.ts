/**
 * useMediaList - Fetch media for a store or item
 */
import { useQuery } from '@tanstack/react-query'
import type { MediaApiResponse } from '@api/types'
import { authGet } from '@shared/lib/auth/authFetch'

interface UseMediaListParams {
  storeId?: string;
  itemId?: string;
}

export function useMediaList({ storeId, itemId }: UseMediaListParams) {
  return useQuery<MediaApiResponse[]>({
    queryKey: ['media', 'list', { storeId, itemId }],
    queryFn: async (): Promise<MediaApiResponse[]> => {
      const params = new URLSearchParams()
      if (storeId) params.set('storeId', storeId)
      if (itemId) params.set('itemId', itemId)
      
      const response = await authGet(`/api/media?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(error.error || 'Failed to load media')
      }

      const payload = await response.json() as { data?: any[] }
      const list = Array.isArray(payload?.data) ? payload.data : []

      return list.map((m: any) => {
        const meta = (m?.metadata ?? {})
        return {
          id: String(m.id),
          url: String(m.url),
          kind: (m.kind as MediaApiResponse['kind']) ?? 'IMAGE',
          filename: String(meta.originalFilename ?? meta.key ?? 'media'),
          size: Number(meta.size ?? m.size ?? 0),
          mimeType: String(meta.mimetype ?? 'application/octet-stream'),
          createdAt: String(m.createdAt ?? ''),
          updatedAt: String(m.updatedAt ?? ''),
          thumbnail: m.thumbnail ?? undefined,
          altText: m.altText ?? undefined,
          sortIndex: typeof m.sortIndex === 'number' ? m.sortIndex : undefined,
          storeId: m.storeId ?? undefined,
          itemId: m.itemId ?? undefined,
        } satisfies MediaApiResponse
      })
    },
    enabled: !!(storeId || itemId)
  })
}
