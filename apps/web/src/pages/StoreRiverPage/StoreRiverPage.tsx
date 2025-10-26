import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { RiverFeed } from '../../features/river'
import { PostComposer } from '../../features/river'
import { Button } from '@ui'
import { usePosts, useCreatePost } from '@hooks/generated'
import { useTogglePostLike } from '@hooks/river'
import type { MediaItem } from '@api/types'
import { styles } from '@utils/tailwind-classes'

export const StoreRiverPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const [showComposer, setShowComposer] = useState(false)

  // Use generated hooks;
  const { data: posts = [], isLoading, error, refetch } = usePosts(storeId ? { storeId } : undefined)
  const createPostMutation = useCreatePost()
  const { toggleLike } = useTogglePostLike()

  const handleCreatePost = async (content: string, media: MediaItem[]) => {
    if (!storeId) return;
    createPostMutation.mutate({
      storeId,
      content,
      mediaUrls: media}, {
      onSuccess: () => {
        setShowComposer(false)
        refetch()
      }
    })
  }

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      toggleLike(postId, post.isLiked || false)
    }
  }

  const handleComment = (postId: string) => {
    // Navigate to post detail or open comment modal;
    console.log('Comment on post:', postId)
  }

  const handleShare = (postId: string) => {
    // Implement share functionality;
    console.log('Share post:', postId)
  }

  const handlePostClick = (postId: string) => {
    // Navigate to post detail page;
    console.log('View post:', postId)
  }

  return (
    <div className={styles['page']}>
      <div className={styles['container']}>
        <header className={styles['header']}>
          <h1 className={styles['title']}>Store River</h1>
          <Button
            variant="primary"
            onClick={() => setShowComposer(!showComposer)}
          >
            {showComposer ? 'Cancel' : 'Create Post'}
          </Button>
        </header>

        {showComposer && storeId && (
          <div className={styles['composerSection']}>
            <PostComposer
              storeId={storeId}
              storeName="Your Store"
              storeImage="https://via.placeholder.com/150"
              onPost={handleCreatePost}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        )}

        <RiverFeed
          posts={posts}
          isLoading={isLoading}
          error={error}
          hasMore={false}
          onLoadMore={() => {}}
          onPostClick={handlePostClick}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onFiltersChange={() => {}}
        />
      </div>
    </div>
  )
}

