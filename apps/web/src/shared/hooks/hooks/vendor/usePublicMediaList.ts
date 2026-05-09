/**
 * usePublicMediaList - Fetch media for a store or item (no auth).
 * Used on public pages like Home where media must load for anonymous visitors.
 */
import { useQuery } from '@tanstack/react-query'
import type { MediaApiResponse } from '@api/types'
import { publicGet } from '@shared/lib/auth/authFetch'

interface UsePublicMediaListParams {
  readonly storeId?: string
  readonly itemId?: string
}

export function usePublicMediaList({ storeId, itemId }: UsePublicMediaListParams) {
  return useQuery<MediaApiResponse[]>({
    queryKey: ['media', 'list', 'public', { storeId, itemId }],
    queryFn: async (): Promise<MediaApiResponse[]> => {
      const params = new URLSearchParams()
      if (storeId) params.set('storeId', storeId)
      if (itemId) params.set('itemId', itemId)

      const response = await publicGet(`/api/media?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(error.error || 'Failed to load media')
      }

      const payload = await response.json() as { data?: unknown[] }
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
    enabled: !!(storeId || itemId),
  })
}

