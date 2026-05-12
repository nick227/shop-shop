import { useState } from 'react'
import type { MediaItem } from '@api/types'
import { getYouTubeEmbedUrl } from '@shared/hooks/hooks/useMediaDetection'
import { Image } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'

interface PostMediaProps {
  readonly media: MediaItem[]
  readonly postId: string
  readonly variant?: 'default' | 'store'
}

function YouTubeEmbed({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <iframe
      src={embedUrl}
      title="YouTube video"
      style={{ border: 'none' }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 w-full h-full"
    />
  )
}

function MediaCell({
  item,
  index,
  postId,
  className = '',
}: {
  item: MediaItem
  index: number
  postId: string
  className?: string
}) {
  if (item.type === 'youtube') {
    return (
      <div className={`overflow-hidden relative bg-black rounded-lg ${className}`}>
        <YouTubeEmbed url={item.url ?? ''} />
      </div>
    )
  }
  return (
    <div className={`overflow-hidden relative rounded-lg bg-muted ${className}`}>
      <Image
        src={item.url ?? ''}
        alt={`Post ${postId} media ${index + 1}`}
        className="object-cover w-full h-full"
        fallbackSeed={item.url}
      />
    </div>
  )
}

export const PostMedia = ({ media, postId, variant = 'default' }: PostMediaProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Handle both media array and string formats
  const normalizedMedia = Array.isArray(media) ? media : media ? [{ url: media, type: 'image' as const }] : []

  if (normalizedMedia.length === 0) return null

  const safeIndex = Math.min(selectedIndex, normalizedMedia.length - 1)

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIndex(index)
  }

  const isStore = variant === 'store'
  const singleVisualClass =
    isStore && normalizedMedia[0]?.type !== 'youtube'
      ? 'aspect-video w-full min-h-[220px] sm:min-h-[min(480px,55vh)] max-h-[70vh]'
      : undefined

  // Single item
  if (normalizedMedia.length === 1) {
    const item = normalizedMedia[0]
    const cellClass =
      item.type === 'youtube'
        ? 'aspect-video w-full'
        : isStore
          ? (singleVisualClass ?? 'aspect-video')
          : 'aspect-[4/3]'
    return (
      <div className={cn('mb-3 w-full', isStore && 'mb-4')}>
        <MediaCell item={item} index={0} postId={postId} className={cellClass} />
      </div>
    )
  }

  // Two items side by side
  if (normalizedMedia.length === 2) {
    return (
      <div className={cn('grid gap-1 mb-3 w-full', isStore ? 'grid-cols-2 gap-2 sm:gap-3' : 'grid-cols-2')}>
        {normalizedMedia.map((item, index) => (
          <MediaCell
            key={item.url ?? `${item.type}-${index}`}
            item={item}
            index={index}
            postId={postId}
            className="aspect-square"
          />
        ))}
      </div>
    )
  }

  // 3+ items: main viewer + thumbnail strip
  return (
    <div className="mb-3 space-y-1.5">
      <MediaCell
        item={normalizedMedia[safeIndex]}
        index={safeIndex}
        postId={postId}
        className="aspect-video"
      />
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {normalizedMedia.map((item, index) => (
          <button
            key={item.url ?? `${item.type}-${index}`}
            type="button"
            onClick={(e) => handleThumbnailClick(index, e)}
            className={[
              'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all duration-150 bg-muted',
              index === safeIndex
                ? 'ring-2 ring-primary ring-offset-1'
                : 'opacity-60 hover:opacity-100',
            ].join(' ')}
          >
            {item.thumbnailUrl || item.thumbnail ? (
              <img
                src={item.thumbnailUrl || item.thumbnail}
                alt={`Thumbnail ${index + 1}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full">
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
