import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RiverFeed, PostComposer } from '@features/river'
import { Button, DataState } from '@ui'
import { usePosts, useCreatePost, useDeletePost, useStore } from '@hooks/generated'
import type { MediaItem } from '@api/types'
import { styles } from '@utils/tailwind-classes'

export default function VendorStoreRiverPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [showComposer, setShowComposer] = useState(false)

  const { data: store, isLoading: storeLoading } = useStore(storeId || '')
  const { data: posts = [], isLoading: postsLoading, error, refetch } = usePosts(
    storeId ? { storeId } : undefined
  )
  const createPostMutation = useCreatePost()
  const deletePostMutation = useDeletePost()

  const handleCreatePost = async (content: string, media: MediaItem[]) => {
    if (!storeId) return;
    createPostMutation.mutate(
      {
        storeId,
        content,
        mediaUrls: media},
      {
        onSuccess: () => {
          setShowComposer(false)
          refetch()
        }}
    )
  }

  const handleDeletePost = (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    deletePostMutation.mutate(postId, {
      onSuccess: () => {
        refetch()
      }})
  }

  const handleBack = () => {
    navigate('/vendor/stores/' + storeId + '/items')
  }

  if (storeLoading) {
    return (
      <div className={styles['loading']}>
        <p>Loading store...</p>
      </div>
    )
  }

  return (
    <div className={styles['page']}>
      <div className={styles['container']}>
        <div className={styles['backButton']}>
          <Button variant="ghost" onClick={handleBack}>
            ← Back to Items;
          </Button>
        </div>

        <header className={styles['header']}>
          <div>
            <h1 className={styles['title']}>Store River</h1>
            <p className={styles['subtitle']}>
              Manage your store's social feed - share updates, photos, videos, and connect with customers;
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowComposer(!showComposer)}
          >
            {showComposer ? 'Cancel' : '+ Create Post'}
          </Button>
        </header>

        {showComposer && storeId && store && (
          <div className="mb-6">
            <PostComposer
              storeId={storeId}
              storeName={store.name}
              storeImage={store.media?.[0]?.url}
              onPost={handleCreatePost}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        )}

        <DataState
          data={posts}
          isLoading={postsLoading}
          error={error}
          emptyMessage="No posts yet. Create your first post to start sharing with customers!"
        >
          {(posts) => (
            <RiverFeed
              posts={posts}
              isLoading={postsLoading}
              error={error}
              hasMore={false}
              onLoadMore={() => {}}
              onPostClick={handleDeletePost}
              onLike={() => {}}
              onComment={() => {}}
              onShare={() => {}}
              onFiltersChange={() => {}}
            />
          )}
        </DataState>
      </div>
    </div>
  )
}

