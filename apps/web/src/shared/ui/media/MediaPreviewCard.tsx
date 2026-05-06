import React, { useState } from 'react'

interface MediaPreviewCardProps {
  media: {
    id: string
    kind: 'IMAGE' | 'VIDEO'
    url: string
    altText?: string
    sortIndex: number
  }
  isPrimary?: boolean
  onDelete?: () => void
  onPreview?: () => void
  disabled?: boolean
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  media,
  isPrimary = false,
  onDelete,
  onPreview,
  disabled = false,
}) => {
  const [imageError, setImageError] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onDelete) {
      if (confirm('Are you sure you want to delete this media?')) {
        onDelete()
      }
    }
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onPreview) {
      onPreview()
    }
  }

  return (
    <div className="relative group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          Primary
        </div>
      )}

      {/* Media Content */}
      <div 
        className="aspect-square cursor-pointer"
        onClick={handlePreview}
      >
        {media.kind === 'IMAGE' ? (
          !imageError ? (
            <img
              src={media.url}
              alt={media.altText || ''}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-1">🖼️</div>
                <div className="text-xs">Image failed to load</div>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
            <video
              src={media.url}
              className="w-full h-full object-cover"
              muted
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              ▶️ Video
            </div>
          </div>
        )}
      </div>

      {/* Actions Overlay */}
      {!disabled && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
              title="Delete media"
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Media Info */}
      <div className="p-2 border-t">
        <div className="text-xs text-gray-500 truncate">
          {media.kind === 'IMAGE' ? '📷 Image' : '🎥 Video'}
        </div>
        {media.altText && (
          <div className="text-xs text-gray-600 truncate mt-1" title={media.altText}>
            {media.altText}
          </div>
        )}
      </div>
    </div>
  )
}
