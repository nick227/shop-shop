import { Navigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PostComposer } from '@/features/river/components/PostComposer/PostComposer'
import { apiClient } from '@api/client'
import type { MediaItem } from '@api/types'
import { Spinner } from '@shared/ui/primitives'
import { useVendorStores } from '@shared/hooks/hooks/vendor'

interface RiverPostRow {
  readonly id: string
  readonly content?: string | null
  readonly createdAt?: string
}

export default function VendorStoreRiverPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const queryClient = useQueryClient()
  const { data: stores = [], isLoading } = useVendorStores()
  const store = stores.find((s) => s.id === storeId)

  const recentQuery = useQuery({
    queryKey: ['river-posts-recent', storeId],
    queryFn: () =>
      apiClient.river.listPosts({ storeId: storeId ?? '', page: 1, limit: 20 }),
    enabled: Boolean(storeId && store),
  })

  const handlePost = async (content: string, media: MediaItem[]) => {
    if (!storeId) return
    try {
      await apiClient.river.createPost({
        storeId,
        content,
        mediaUrls: media,
        source: 'MANUAL',
      })
      toast.success('River post published')
      await queryClient.invalidateQueries({ queryKey: ['river-posts-recent', storeId] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not publish post')
      throw e
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!storeId || !store) {
    return <Navigate to="/vendor/dashboard" replace />
  }

  const rows = (recentQuery.data?.data ?? []) as RiverPostRow[]
  const imageUrl = (store as { imageUrl?: string | null }).imageUrl ?? undefined

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">River — {store.name}</h1>
        <p className="text-sm text-muted-foreground">
          Posts appear in the public River under your store name.
        </p>
      </div>

      <PostComposer
        storeId={storeId}
        storeName={store.name}
        storeImage={imageUrl}
        onPost={handlePost}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent posts</h2>
        {recentQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
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
