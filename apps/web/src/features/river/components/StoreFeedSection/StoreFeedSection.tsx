import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { RiverPost } from '@api/types'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import { PostCard } from '@/features/river/components/PostCard/PostCard'
import { Button, Skeleton } from '@shared/ui/primitives'

interface StoreFeedSectionProps {
  readonly storeId: string
  readonly storeName: string
}

/** Store-scoped River slice: same `getFeed` + mapping as global River; posts rank in Shop River too. */
export function StoreFeedSection({ storeId, storeName }: StoreFeedSectionProps) {
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

  if (error) {
    return (
      <section className="max-w-2xl space-y-2">
        <h2 className="text-xl font-bold text-foreground">Feed</h2>
        <p className="text-sm text-muted-foreground">Could not load updates right now.</p>
      </section>
    )
  }

  if (isLoading && !data) {
    return (
      <section className="max-w-2xl space-y-3">
        <h2 className="text-xl font-bold text-foreground">Feed</h2>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-2xl space-y-4">
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

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates from this kitchen yet.</p>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {posts.map((post: RiverPost) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      {hasNextPage ? (
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
      ) : null}
    </section>
  )
}
