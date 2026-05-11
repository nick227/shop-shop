import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { RiverHeader } from '@/features/river/components/RiverHeader/RiverHeader'
import { LoadingSkeleton } from '@/features/river/components/LoadingSkeleton/LoadingSkeleton'
import { RiverHero } from '@/features/river/components/RiverHero/RiverHero'
import { RiverDiscovery } from '@/features/river/components/RiverDiscovery/RiverDiscovery'
import { RiverCommentsPanel } from '@/features/river/components/RiverCommentsPanel/RiverCommentsPanel'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import { useRiverPostActions } from '@/features/river/hooks/useRiverPostActions'
import { RiverFilters as RiverFiltersType, RiverPost } from '@api/types'
import { Button } from '@shared/ui/primitives'
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from 'lucide-react'
import { apiClient } from '@api/client'
import { useHeroStore } from '@shared/hooks/hooks/store'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'

function RiverTileCard({ post }: { post: RiverPost }) {
  return (
    <article className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
      {post.media?.[0]?.url ? (
        <img
          src={post.media[0].url}
          alt={post.media[0].title || post.storeName || 'River post'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-gray-400">
          No media
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2">
        <p className="truncate text-xs font-medium text-white">
          {post.storeName ?? 'Store'}
        </p>
      </div>
    </article>
  )
}

interface LayoutBreaker {
  kind: 'layout-breaker'
  layout: 'grid-2x2' | 'grid-3x3' | 'featured'
  posts: RiverPost[]
}

function determineLayoutPattern(postIndex: number): 'feed' | 'grid-2x2' | 'grid-3x3' | 'featured' {
  const cycle = postIndex % 24
  
  if (cycle >= 8 && cycle < 12) return 'grid-2x2'
  if (cycle >= 20 && cycle < 24) return 'grid-3x3'
  if (cycle === 16) return 'featured'
  
  return 'feed'
}

function groupPostsByLayout(posts: RiverPost[]): (RiverPost | LayoutBreaker)[] {
  const result: (RiverPost | LayoutBreaker)[] = []
  let currentGridPosts: RiverPost[] = []
  let currentGridType: 'grid-2x2' | 'grid-3x3' | null = null

  posts.forEach((post, index) => {
    const layout = determineLayoutPattern(index)
    
    if (layout === 'feed') {
      // Flush any pending grid
      if (currentGridPosts.length > 0 && currentGridType) {
        result.push({ kind: 'layout-breaker', layout: currentGridType, posts: currentGridPosts })
        currentGridPosts = []
        currentGridType = null
      }
      result.push(post)
    } else if (layout === 'grid-2x2' || layout === 'grid-3x3') {
      if (currentGridType !== layout) {
        // Flush previous grid if different type
        if (currentGridPosts.length > 0 && currentGridType) {
          result.push({ kind: 'layout-breaker', layout: currentGridType, posts: currentGridPosts })
        }
        currentGridPosts = []
        currentGridType = layout
      }
      currentGridPosts.push(post)
      
      // Complete grid when we have enough posts
      const maxPosts = layout === 'grid-2x2' ? 4 : 9
      if (currentGridPosts.length === maxPosts) {
        result.push({ kind: 'layout-breaker', layout: currentGridType, posts: currentGridPosts })
        currentGridPosts = []
        currentGridType = null
      }
    } else if (layout === 'featured') {
      // Flush any pending grid
      if (currentGridPosts.length > 0 && currentGridType) {
        result.push({ kind: 'layout-breaker', layout: currentGridType, posts: currentGridPosts })
        currentGridPosts = []
        currentGridType = null
      }
      result.push({ kind: 'layout-breaker', layout: 'featured', posts: [post] })
    }
  })

  // Flush remaining grid posts
  if (currentGridPosts.length > 0 && currentGridType) {
    result.push({ kind: 'layout-breaker', layout: currentGridType, posts: currentGridPosts })
  }

  return result
}

function EnhancedPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
}: {
  readonly post: RiverPost
  readonly onLike?: () => void
  readonly onComment?: () => void
  readonly onShare?: () => void
  readonly onSave?: () => void
}) {
  const handleLike = useCallback(() => {
    onLike?.()
  }, [onLike])

  const handleSave = useCallback(() => {
    onSave?.()
  }, [onSave])

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Store Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={post.storeImage || '/api/placeholder/40/40'}
              alt={post.storeName ?? 'Store'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
            />
            {post.storeVerified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link 
                to={post.storeId ? getStoreRoute({ id: post.storeId, name: post.storeName ?? 'Store' }) : '#'}
                className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors"
              >
                {post.storeName ?? 'Store'}
              </Link>
              {post.storeCategory != null && post.storeCategory !== '' ? (
                <span className="text-xs text-gray-500">• {post.storeCategory}</span>
              ) : null}
            </div>
            {post.storeDistance && (
              <p className="text-xs text-gray-500">{post.storeDistance} miles away</p>
            )}
          </div>
        </div>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Media Content */}
      <div className="relative aspect-square bg-gray-50">
        {post.media && post.media.length > 0 ? (
          <div className="relative w-full h-full">
            {post.media.length === 1 ? (
              <img
                src={post.media[0].url}
                alt={post.media[0].title || 'Post image'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={post.media[0].url}
                  alt={post.media[0].title || 'Post image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {post.media.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                    +{post.media.length - 1}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-2" />
              <p className="text-sm">No media</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {post.content && (
          <p className="text-gray-900 text-sm mb-3 line-clamp-2">{post.content}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`p-2 rounded-lg transition-all ${
                post.isLiked
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onComment?.()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => onShare?.()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`p-2 rounded-lg transition-all ${
              post.isSaved
                ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Engagement Stats */}
        <div className="text-xs text-gray-500">
          {post.likesCount !== undefined && post.likesCount > 0 && (
            <span className="font-semibold text-gray-900">{post.likesCount} likes</span>
          )}
          {post.likesCount !== undefined && post.likesCount > 0 && post.commentsCount !== undefined && post.commentsCount > 0 && ' • '}
          {post.commentsCount !== undefined && post.commentsCount > 0 && (
            <span>{post.commentsCount} comments</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default function RiverPage() {
  const [filters, setFilters] = useState<RiverFiltersType>({
    sortBy: 'recent',
    lat: undefined,
    lng: undefined,
    radiusMiles: 25,
  })
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null)

  const { data: heroStore, isLoading: heroLoading } = useHeroStore()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['river-feed', filters],
    queryFn: ({ pageParam }: { pageParam?: string }) => apiClient.river.getFeed({
      cursor: pageParam,
      limit: 20,
      storeId: filters.storeId,
      near: filters.lat && filters.lng ? {
        lat: filters.lat,
        lng: filters.lng,
        radiusMiles: filters.radiusMiles || 25,
      } : undefined,
      allowEmptyMedia: true,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  })

  const posts = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        (page.items ?? []).map((row) => mapFeedItemToRiverPost(row as RiverFeedItemWire)),
      ) ?? []
    )
  }, [data])

  const actions = useRiverPostActions({
    storeId: undefined,
    onOpenComments: (id) => setCommentsPostId(id),
  })

  const layoutedPosts = useMemo(() => {
    return groupPostsByLayout(posts)
  }, [posts])

  const handleFiltersChange = useCallback((newFilters: RiverFiltersType) => {
    setFilters(newFilters)
  }, [])

  const renderPostItem = (item: RiverPost | LayoutBreaker, index: number) => {
    if (!('kind' in item)) {
      const p = item
      return (
        <div key={item.id} className="max-w-2xl mx-auto">
          <EnhancedPostCard
            post={p}
            onLike={() => {
              void actions.like(p.id, Boolean(p.isLiked))
            }}
            onComment={() => {
              actions.comment(p.id)
            }}
            onShare={() => {
              void actions.share(p.id)
            }}
            onSave={() => {
              void actions.save(p.id, Boolean(p.isSaved))
            }}
          />
        </div>
      )
    }

    if (item.layout === 'grid-2x2') {
      return (
        <div key={`grid-2x2-${index}`} className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {item.posts.map((post) => (
              <EnhancedPostCard
                key={post.id}
                post={post}
                onLike={() => {
                  void actions.like(post.id, Boolean(post.isLiked))
                }}
                onComment={() => {
                  actions.comment(post.id)
                }}
                onShare={() => {
                  void actions.share(post.id)
                }}
                onSave={() => {
                  void actions.save(post.id, Boolean(post.isSaved))
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    if (item.layout === 'grid-3x3') {
      return (
        <div key={`grid-3x3-${index}`} className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {item.posts.map((post) => (
              <RiverTileCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )
    }

    if (item.layout === 'featured') {
      return (
        <div key={`featured-${index}`} className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Post</h2>
            {item.posts.map((post) => (
              <EnhancedPostCard
                key={post.id}
                post={post}
                onLike={() => {
                  void actions.like(post.id, Boolean(post.isLiked))
                }}
                onComment={() => {
                  actions.comment(post.id)
                }}
                onShare={() => {
                  void actions.share(post.id)
                }}
                onSave={() => {
                  void actions.save(post.id, Boolean(post.isSaved))
                }}
              />
            ))}
          </div>
        </div>
      )
    }
  }

  if (isLoading && !data) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load river</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {commentsPostId ? (
        <RiverCommentsPanel
          postId={commentsPostId}
          onClose={() => setCommentsPostId(null)}
          isAuthenticated={actions.isAuthenticated}
          onRequireLogin={actions.redirectToLogin}
        />
      ) : null}
      <RiverHeader filters={filters} onFiltersChange={handleFiltersChange} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Hero and Discovery sections - show once at top */}
          <div className="max-w-2xl mx-auto space-y-6">
            <RiverHero store={heroStore} isLoading={heroLoading} />
            <RiverDiscovery />
          </div>
          
          {layoutedPosts.map((item, index) => renderPostItem(item, index))}
        </div>

        {hasNextPage && (
          <div className="text-center mt-12">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              isLoading={isFetchingNextPage}
              variant="outline"
              size="large"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {!hasNextPage && posts.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">You've reached the end of the river</p>
          </div>
        )}

        {posts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-600">Be the first to share something amazing!</p>
          </div>
        )}
      </main>
    </div>
  )
}
