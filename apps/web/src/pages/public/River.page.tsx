import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { RiverHero } from '@/features/river/components/RiverHero/RiverHero'
import { RiverCommentsPanel } from '@/features/river/components/RiverCommentsPanel/RiverCommentsPanel'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import { useRiverPostActions } from '@/features/river/hooks/useRiverPostActions'
import { RiverDiscovery } from '@/features/river/components/RiverDiscovery/RiverDiscovery'
import type { RiverFilters as RiverFiltersType, RiverPost } from '@api/types'
import { Button, Skeleton } from '@shared/ui/primitives'
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react'
import { apiClient } from '@api/client'
import { useHeroStore } from '@shared/hooks/hooks/store'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { PAGE_SHELL_CONTAINER_CLASS } from '@shared/ui/layout/PageShell'
import { cn } from '@shared/lib/cn'

function FeedLoadingCards() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden bg-white rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center p-4 pb-2">
            <div className="flex gap-3 items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
            <Skeleton className="w-8 h-8" />
          </div>
          <div className="bg-gray-100 aspect-square" />
          <div className="p-4 space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10" />
              <Skeleton className="w-10 h-10" />
              <Skeleton className="w-10 h-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RiverTileCard({ post }: { post: RiverPost }) {
  return (
    <article className="overflow-hidden relative bg-gray-100 rounded-xl aspect-square">
      {post.media?.[0]?.url ? (
        <img
          src={post.media[0].url}
          alt={post.media[0].title || post.storeName || 'River post'}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      ) : (
        <div className="flex justify-center items-center h-full text-xs text-gray-400">
          No media
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2 bg-black/50">
        <p className="text-xs font-medium text-white truncate">
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

  return (
    <article className="overflow-hidden bg-white rounded-2xl border border-gray-100 transition-all duration-300 group hover:shadow-lg">
      {/* Store Header */}
      <div className="flex justify-between items-center p-4 pb-2">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <img
              src={post.storeImage || '/api/placeholder/40/40'}
              alt={post.storeName ?? 'Store'}
              className="object-cover w-10 h-10 rounded-full ring-2 ring-gray-100"
            />
            {post.storeVerified && (
              <div className="flex absolute -right-1 -bottom-1 justify-center items-center w-4 h-4 bg-blue-500 rounded-full">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex gap-2 items-center">
              <Link 
                to={post.storeId ? getStoreRoute({ id: post.storeId, name: post.storeName ?? 'Store' }) : '#'}
                className="text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600"
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
      <div className="relative bg-gray-50 aspect-square">
        {post.media && post.media.length > 0 ? (
          <div className="relative w-full h-full">
            {post.media.length === 1 ? (
              <img
                src={post.media[0].url}
                alt={post.media[0].title || 'Post image'}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={post.media[0].url}
                  alt={post.media[0].title || 'Post image'}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                {post.media.length > 1 && (
                  <div className="absolute top-4 right-4 px-2 py-1 text-xs font-medium text-white rounded-full bg-black/60">
                    +{post.media.length - 1}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center w-full h-full text-gray-400">
            <div className="text-center">
              <div className="mx-auto mb-2 w-16 h-16 bg-gray-200 rounded-2xl" />
              <p className="text-sm">No media</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {post.content && (
          <p className="mb-3 text-sm text-gray-900 line-clamp-2">{post.content}</p>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-1 items-center">
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
              className="p-2 text-gray-600 rounded-lg transition-colors hover:bg-gray-100"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => onShare?.()}
              className="p-2 text-gray-600 rounded-lg transition-colors hover:bg-gray-100"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
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
        <div key={item.id} className="w-full">
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
        <div key={`grid-2x2-${index}`} className="w-full">
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
        <div key={`grid-3x3-${index}`} className="w-full">
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
        <div key={`featured-${index}`} className="w-full">
          <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Featured Post</h2>
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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Failed to load river</h2>
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
      
      <main className={cn(PAGE_SHELL_CONTAINER_CLASS, 'py-6 max-w-3xl md:py-10')}>
        <div className="space-y-6">
          <div className="space-y-6 w-full">
            <RiverHero store={heroStore} isLoading={heroLoading} />
          </div>

          <RiverDiscovery />

          {isLoading && !data ? (
            <FeedLoadingCards />
          ) : (
            layoutedPosts.map((item, index) => renderPostItem(item, index))
          )}
        </div>

        {hasNextPage && (
          <div className="mt-12 text-center">
            <Button
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              isLoading={isFetchingNextPage}
              variant="outline"
              size="large"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {posts.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="flex justify-center items-center mx-auto mb-4 w-24 h-24 bg-gray-100 rounded-full">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">No posts yet</h2>
          </div>
        )}
      </main>
    </div>
  )
}
