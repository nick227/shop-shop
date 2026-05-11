import { useState, useMemo, memo } from 'react'
import type { RiverPost, RiverFilters as RiverFiltersType } from '@api/types'
import { PostCard } from '../PostCard/PostCard'
import { Skeleton, Button } from '@shared/ui/primitives'
import { RiverFilters } from '../RiverFilters'
import { RiverHero } from './RiverHero/RiverHero'
import { RiverDiscovery } from './RiverDiscovery/RiverDiscovery'

interface RiverFeedProps {
  readonly posts: RiverPost[]
  readonly isLoading: boolean
  readonly error: Error | null
  readonly hasMore: boolean
  readonly onLoadMore: () => void
  readonly onPostClick?: (postId: string) => void
  readonly onLike?: (postId: string) => void
  readonly onComment?: (postId: string) => void
  readonly onShare?: (postId: string) => void
  readonly onFiltersChange?: (filters: RiverFiltersType) => void
}

function PostSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-3 pt-1">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  )
}

export const RiverFeed = memo(function RiverFeed({
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
}: RiverFeedProps) {
  const [filters, setFilters] = useState<RiverFiltersType>({ sortBy: 'recent' })

  const handleFiltersChange = (newFilters: RiverFiltersType) => {
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const memoizedPosts = useMemo(
    () =>
      posts.map((post, index) => {
        // Insert RiverHero every 3rd post (index 2, 5, 8, etc.)
        const shouldShowHero = (index + 1) % 3 === 0
        
        // Insert RiverDiscovery every 6th post (index 5, 11, 17, etc.)
        const shouldShowDiscovery = (index + 1) % 6 === 0
        
        return (
          <>
            {shouldShowHero && post.store && (
              <RiverHero 
                key={`hero-${post.id}`}
                store={post.store} 
                isLoading={isLoading} 
              />
            )}
            
            {shouldShowDiscovery && (
              <RiverDiscovery 
                key={`discovery-${post.id}`}
              />
            )}
            
            <PostCard
              key={post.id ?? `post-${index}`}
              post={post}
              onPostClick={onPostClick}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
            />
          </>
        )
      }),
    [posts, onPostClick, onLike, onComment, onShare]
  )

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-base font-semibold text-destructive mb-1">Failed to load posts</p>
        <p className="text-sm text-muted-foreground">{error.message ?? 'Unknown error'}</p>
      </div>
    )
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        {[0, 1, 2].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-base font-semibold text-foreground mb-1">No posts yet</p>
        <p className="text-sm text-muted-foreground">Be the first to share something!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <RiverFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <div className="space-y-3">
        {memoizedPosts}
      </div>

      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="small"
            onClick={onLoadMore}
            isLoading={isLoading}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
})
