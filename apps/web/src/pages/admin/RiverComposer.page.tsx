import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { PostComposer } from '@/features/river/components/PostComposer/PostComposer'
import { apiClient } from '@api/client'
import { OFFICIAL_PLATFORM_STORE_SLUG } from '@/constants/platformStore'
import type { MediaItem } from '@api/types'
import { Spinner } from '@shared/ui/primitives'

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface AdminStoreRow {
  readonly id: string
  readonly name: string
  readonly slug: string
}

interface RiverPostRow {
  readonly id: string
  readonly content?: string | null
  readonly createdAt?: string
}

export default function AdminRiverComposerPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['admin-stores-river-picker'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/stores?page=1&limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load stores')
      return res.json() as Promise<{ stores: AdminStoreRow[] }>
    },
    enabled: Boolean(token),
  })

  const stores = storesData?.stores ?? []

  const defaultId = useMemo(() => {
    const official = stores.find((s) => s.slug === OFFICIAL_PLATFORM_STORE_SLUG)
    return official?.id ?? stores[0]?.id ?? ''
  }, [stores])

  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (!selectedId && defaultId) setSelectedId(defaultId)
  }, [defaultId, selectedId])

  const selected = stores.find((s) => s.id === selectedId)

  const recentQuery = useQuery({
    queryKey: ['river-posts-recent', selectedId],
    queryFn: () => apiClient.river.listPosts({ storeId: selectedId, page: 1, limit: 20 }),
    enabled: Boolean(selectedId),
  })

  const handlePost = async (content: string, media: MediaItem[]) => {
    try {
      await apiClient.river.createPost({
        storeId: selectedId,
        content,
        mediaUrls: media,
        source: 'MANUAL',
      })
      toast.success('River post published')
      await queryClient.invalidateQueries({ queryKey: ['river-posts-recent', selectedId] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not publish post')
      throw e
    }
  }

  if (storesLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  const rows = (recentQuery.data?.data ?? []) as RiverPostRow[]

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">River composer</h1>
        <p className="text-sm text-muted-foreground">
          Post as Shop Shop (editorial) or any vendor store. Same API as the vendor River page.
        </p>
      </div>

      {stores.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stores found. Seed the DB or create a store first.</p>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium">Post as store</span>
          <select
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
                {s.slug === OFFICIAL_PLATFORM_STORE_SLUG ? ' — platform' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedId && selected ? (
        <PostComposer
          storeId={selectedId}
          storeName={selected.name}
          onPost={handlePost}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent posts (this store)</h2>
        {recentQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet for this store.</p>
            ) : (
              rows.map((p) => (
                <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-muted-foreground line-clamp-3">{p.content?.trim() || '(no text)'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                  </p>
                </li>
              ))
            )}
          </ul>
        )}
      </section>
    </div>
  )
}
