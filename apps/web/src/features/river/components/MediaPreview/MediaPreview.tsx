import type { MediaItem } from '@api/types'
import { truncateUrl } from '@utils/media'

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif"%3EImage%3C/text%3E%3C/svg%3E'

interface MediaPreviewProps {
  readonly media: MediaItem[]
  readonly onRemove?: (index: number) => void
  readonly editable?: boolean
}

export const MediaPreview = ({
  media,
  onRemove,
  editable = true,
}: MediaPreviewProps) => {
  if (media.length === 0) return

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove(index)
    }
  }

  return (
    <div className="grid gap-2">
      {media.map((item, index) => (
        <div key={item.url ?? `${item.type}-${index}`} className="relative rounded-lg overflow-hidden border border-border">
          {item.type === 'youtube' && (
            <div className="relative aspect-video">
              <img
                src={item.thumbnail ?? FALLBACK_IMAGE}
                alt="YouTube video"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target?.src) {
                    target.src = FALLBACK_IMAGE
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                  YouTube
                </span>
              </div>
            </div>
          )}

          {item.type === 'image' && (
            <div className="relative aspect-square">
              <img
                src={item.url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target?.src) {
                    target.src = FALLBACK_IMAGE
                  }
                }}
              />
            </div>
          )}

          {editable && onRemove && (
            <button
              type="button"
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-destructive/90"
              onClick={(e) => handleRemove(index, e)}
              aria-label="Remove media"
            >
              ×
            </button>
          )}

          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-sm text-muted-foreground truncate" title={item.url ?? ''}>
              {truncateUrl(item.url!, 40)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

