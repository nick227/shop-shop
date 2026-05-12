import type { RiverPost } from '@api/types'
import type { MediaItem } from '@api/backend-types'
import { resolveRiverAssetUrl } from '@/features/river/resolveRiverAssetUrl'

/** Wire shape from GET /api/v1/river/feed (matches RiverFeedItem JSON) and GET /api/v1/river/posts. */
export interface RiverFeedItemWire {
  readonly id: string
  // Feed endpoint structure
  readonly actor?: {
    readonly kind: string
    readonly storeId?: string
    readonly displayName: string
    readonly avatarUrl?: string
  }
  readonly body?: string | null
  // Posts endpoint structure
  readonly storeId?: string
  readonly storeName?: string
  readonly storeImage?: string
  readonly content?: string | null
  // Common fields
  readonly media: ReadonlyArray<{
    readonly type: string
    readonly url: string
    readonly thumbnailUrl?: string
    readonly thumbnail?: string
    readonly width?: number
    readonly height?: number
  }>
  readonly title?: string | null
  readonly source?: string
  readonly links?: {
    readonly storeId: string
    readonly itemId?: string
  }
  readonly likesCount?: number
  readonly commentsCount?: number
  readonly sharesCount?: number
  readonly isLiked?: boolean
  readonly isSaved?: boolean
  readonly createdAt?: string
  readonly priority?: number
}

function mapFeedMediaToMediaItems(
  media: RiverFeedItemWire['media'],
): MediaItem[] {
  const out: MediaItem[] = []
  for (const m of media) {
    if (!m.url) continue
    const t: MediaItem['type'] = m.type === 'video' ? 'video' : 'image'
    const url = resolveRiverAssetUrl(m.url) ?? m.url
    const thumbRaw = m.thumbnailUrl || m.thumbnail
    const thumbnail = resolveRiverAssetUrl(thumbRaw) ?? thumbRaw
    out.push({
      type: t,
      url,
      thumbnail,
      width: m.width,
      height: m.height,
    })
  }
  return out
}

/** Normalize feed API rows for components that expect {@link RiverPost}. */
export function mapFeedItemToRiverPost(item: RiverFeedItemWire): RiverPost {
  // Handle both feed endpoint (with actor) and posts endpoint (direct properties)
  const storeId = item.actor?.storeId ?? item.storeId ?? item.links?.storeId ?? ''
  const storeName = item.actor?.displayName ?? item.storeName ?? ''
  const storeImageRaw = item.actor?.avatarUrl ?? item.storeImage ?? ''
  const storeImage = resolveRiverAssetUrl(storeImageRaw) ?? storeImageRaw
  const content = item.body ?? item.content ?? undefined
  const media = mapFeedMediaToMediaItems(item.media)
  
  return {
    id: item.id,
    storeId,
    content,
    storeName,
    storeImage,
    media,
    createdAt: item.createdAt,
    likesCount: item.likesCount,
    commentsCount: item.commentsCount,
    sharesCount: item.sharesCount,
    isLiked: item.isLiked,
    isSaved: item.isSaved,
  }
}
