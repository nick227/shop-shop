import { useState } from 'react'
import type { MediaItem } from '@api/types'
import { getYouTubeEmbedUrl } from '@shared/hooks/hooks/useMediaDetection'
import { Image } from '@shared/ui/primitives'

interface PostMediaProps {
  readonly media: MediaItem[]
  readonly postId: string
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
      <div className={`relative overflow-hidden rounded-lg bg-black ${className}`}>
        <YouTubeEmbed url={item.url ?? ''} />
      </div>
    )
  }
  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${className}`}>
      <Image
        src={item.url ?? ''}
        alt={`Post ${postId} media ${index + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
        fallbackSeed={item.url}
      />
    </div>
  )
}

export const PostMedia = ({ media, postId }: PostMediaProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Handle both media array and string formats
  const normalizedMedia = Array.isArray(media) ? media : media ? [{ url: media, type: 'image' as const }] : []

  if (normalizedMedia.length === 0) return null

  const safeIndex = Math.min(selectedIndex, normalizedMedia.length - 1)

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIndex(index)
  }

  // Single item
  if (normalizedMedia.length === 1) {
    const item = normalizedMedia[0]
    return (
      <div className="mb-3">
        <MediaCell
          item={item}
          index={0}
          postId={postId}
          className={item.type === 'youtube' ? 'aspect-video' : 'aspect-[4/3]'}
        />
      </div>
    )
  }

  // Two items side by side
  if (normalizedMedia.length === 2) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1">
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
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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
