import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { RiverPost } from '@api/types'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import { PostCard } from '@/features/river/components/PostCard/PostCard'
import { RiverCommentsPanel } from '@/features/river/components/RiverCommentsPanel/RiverCommentsPanel'
import { useRiverPostActions } from '@/features/river/hooks/useRiverPostActions'
import { Button, Skeleton } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'

interface StoreFeedSectionProps {
  readonly storeId: string
  readonly storeName: string
  /** Layout wrapper; default fills parent (e.g. store PageShell container). */
  readonly className?: string
  /** When false, omits the built-in “Feed” title row (parent supplies page-level heading). */
  readonly showFeedHeader?: boolean
  /** Larger cards + comfortable actions — store detail page */
  readonly layout?: 'default' | 'store'
}

/** Store-scoped River slice: same `getFeed` + mapping as global River; posts rank in Shop River too. */
export function StoreFeedSection({
  storeId,
  storeName,
  className,
  showFeedHeader = true,
  layout = 'default',
}: StoreFeedSectionProps) {
  const [commentsPostId, setCommentsPostId] = useState<string | undefined>()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['store-feed', storeId],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      apiClient.river.getFeed({
        cursor: pageParam,
        limit: 12,
        storeId,
        allowEmptyMedia: true,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: Boolean(storeId),
  })

  const posts = useMemo(
    () =>
      data?.pages.flatMap((page) =>
        (page.items ?? []).map((row) => mapFeedItemToRiverPost(row as RiverFeedItemWire)),
      ) ?? [],
    [data],
  )

  const postsById = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts])

  const actions = useRiverPostActions({
    storeId,
    onOpenComments: (id) => setCommentsPostId(id),
  })

  const handleLike = useCallback(
    (postId: string) => {
      const p = postsById.get(postId)
      if (!p) return
      void actions.like(postId, Boolean(p.isLiked))
    },
    [actions, postsById],
  )

  const handleSave = useCallback(
    (postId: string) => {
      const p = postsById.get(postId)
      if (!p) return
      void actions.save(postId, Boolean(p.isSaved))
    },
    [actions, postsById],
  )

  const handleComment = useCallback(
    (postId: string) => {
      actions.comment(postId)
    },
    [actions],
  )

  const handleShare = useCallback(
    (postId: string) => {
      void actions.share(postId)
    },
    [actions],
  )

  const isStoreLayout = layout === 'store'

  const wrap = (children: ReactNode) => (
    <section className={cn('w-full', isStoreLayout ? 'space-y-6' : 'space-y-4', className)}>{children}</section>
  )

  if (error) {
    return wrap(
      <>
        <h2 className="text-xl font-bold text-foreground">Feed</h2>
        <p className="text-sm text-muted-foreground">Could not load updates right now.</p>
      </>,
    )
  }

  if (isLoading && !data) {
    return wrap(
      <>
        <h2 className="text-xl font-bold text-foreground">Feed</h2>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className={cn('w-full rounded-xl', isStoreLayout ? 'h-48 sm:h-52' : 'h-36')} />
          ))}
        </div>
      </>,
    )
  }

  return wrap(
    <>
      {commentsPostId ? (
        <RiverCommentsPanel
          postId={commentsPostId}
          onClose={() => setCommentsPostId(undefined)}
          isAuthenticated={actions.isAuthenticated}
          onRequireLogin={actions.redirectToLogin}
        />
      ) : undefined}

      {showFeedHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">Feed</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Updates from {storeName} appear on Shop River too.
            </p>
          </div>
          <Link to="/river" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Shop River
          </Link>
        </div>
      ) : undefined}

      {posts.length === 0 ? (
        <p className={cn('text-muted-foreground', isStoreLayout ? 'text-base' : 'text-sm')}>
          No updates from this kitchen yet.
        </p>
      ) : (
        <ul className={cn('m-0 list-none p-0 w-full', isStoreLayout ? 'space-y-5 md:space-y-6' : 'space-y-3')}>
          {posts.map((post: RiverPost) => (
            <li key={post.id} className="w-full">
              <PostCard
                post={post}
                variant={isStoreLayout ? 'store' : 'default'}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onSave={handleSave}
              />
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </>,
  )
}
