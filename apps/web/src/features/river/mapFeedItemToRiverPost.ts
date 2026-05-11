import type { RiverPost } from '@api/types'
import type { MediaItem } from '@api/backend-types'

/** Wire shape from GET /api/v1/river/feed (matches RiverFeedItem JSON). */
export interface RiverFeedItemWire {
  readonly id: string
  readonly actor: {
    readonly kind: string
    readonly storeId?: string
    readonly displayName: string
    readonly avatarUrl?: string
  }
  readonly body: string | null
  readonly media: ReadonlyArray<{
    readonly type: string
    readonly url: string
    readonly thumbnailUrl?: string
    readonly width?: number
    readonly height?: number
  }>
  readonly links?: { readonly storeId?: string; readonly itemId?: string }
}

function mapFeedMediaToMediaItems(
  media: RiverFeedItemWire['media'],
): MediaItem[] {
  const out: MediaItem[] = []
  for (const m of media) {
    if (!m.url) continue
    const t: MediaItem['type'] = m.type === 'video' ? 'video' : 'image'
    out.push({
      type: t,
      url: m.url,
      thumbnail: m.thumbnailUrl,
      width: m.width,
      height: m.height,
    })
  }
  return out
}

/** Normalize feed API rows for components that expect {@link RiverPost}. */
export function mapFeedItemToRiverPost(item: RiverFeedItemWire): RiverPost {
  const storeId = item.actor.storeId ?? item.links?.storeId ?? ''
  const media = mapFeedMediaToMediaItems(item.media)
  return {
    id: item.id,
    storeId,
    content: item.body ?? undefined,
    storeName: item.actor.displayName,
    storeImage: item.actor.avatarUrl,
    media,
    // Feed payload does not include counts yet; card hides stats when absent.
  }
}
