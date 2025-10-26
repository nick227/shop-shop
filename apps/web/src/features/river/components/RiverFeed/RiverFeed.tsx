import { useState, useMemo, memo } from 'react'
import type { RiverPost, RiverFilters as RiverFiltersType } from '@api/types'
import { PostCard } from '../PostCard'
import { Spinner } from '@ui/Spinner'
import { Button } from '@ui/Button'
import { RiverFilters } from '../RiverFilters'

interface RiverFeedProps {
  posts: RiverPost[]
  isLoading: boolean
  error: Error | null
  hasMore: boolean
  onLoadMore: () => void
  onPostClick?: (postId: string) => void
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onFiltersChange?: (filters: RiverFiltersType) => void
}

export const RiverFeed = memo(({
  posts,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onPostClick,
  onLike,
  onComment,
  onShare,
  onFiltersChange,
}: RiverFeedProps) => {
  const [filters, setFilters] = useState<RiverFiltersType>({
    sortBy: 'recent',
  })

  const handleFiltersChange = (newFilters: RiverFiltersType) => {
    setFilters(newFilters)
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    }
  }

  // Memoize posts rendering to prevent unnecessary re-renders
  const memoizedPosts = useMemo(() => 
    posts.map((post) => (
      <PostCard
        key={post.id}
        post={post}
        onPostClick={onPostClick}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    )),
    [posts, onPostClick, onLike, onComment, onShare]
  )

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-bold text-destructive mb-2">Failed to load posts</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-4">
        <Spinner size="large" />
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-bold text-foreground mb-2">No posts yet</p>
        <p className="text-muted-foreground">Be the first to share something!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RiverFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <div className="space-y-6">
        {memoizedPosts}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load more posts'}
          </Button>
        </div>
      )}
    </div>
  )
})

