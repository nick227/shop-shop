import { useState } from 'react'
import type { MediaItem } from '../../../../api/types'
import { getYouTubeEmbedUrl } from '../../../../hooks/useMediaDetection'
import { Image } from '../../../../components/ui/Image/Image'

interface PostMediaProps {
  readonly media: MediaItem[]
  readonly postId: string // UUID
}

export const PostMedia = ({ media, postId }: PostMediaProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (media.length === 0) return

  // Bounds checking: reset selectedIndex if it's out of range
  const safeIndex = selectedIndex >= media.length ? 0 : selectedIndex

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIndex(index)
  }

  const renderMediaItem = (item: MediaItem, index: number) => {
    if (item.type === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl((item.url) ?? '')
      if (!embedUrl) return

      return (
        <div key={item.url ?? `youtube-${index}`} className="mb-4">
          <iframe
            src={embedUrl}
            title="YouTube video"
            style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video rounded-lg"
          />
        </div>
      )
    }

    if (item.type === 'image') {
      return (
        <div key={item.url ?? `image-${index}`} className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={(item.url) ?? ''}
            alt={`Post ${postId} media ${index + 1}`}
          />
        </div>
      )
    }
  }

  const renderMediaLayout = () => {
    if (media.length === 1) {
      return (
        <div className="aspect-video">
          {media[0] ? renderMediaItem(media[0], 0) : undefined}
        </div>
      )
    }

    return (
      <div className="grid gap-2">
        <div className="aspect-video">
          {media[safeIndex] ? renderMediaItem(media[safeIndex], safeIndex) : undefined}
        </div>
        
        {media.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {media.map((item, index) => (
              <button
                key={item.url ?? `${item.type}-${index}`}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-colors cursor-pointer overflow-hidden ${
                  index === safeIndex ? 'border-primary' : 'border-transparent hover:border-primary'
                }`}
                onClick={(e) => handleThumbnailClick(index, e)}
                type="button"
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {item.type === 'youtube' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <div className="mb-4">{renderMediaLayout()}</div>
}
