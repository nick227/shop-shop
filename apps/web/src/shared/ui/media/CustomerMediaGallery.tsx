import React, { useState } from 'react'

interface CustomerMediaGalleryProps {
  media: Array<{
    id: string
    kind: 'IMAGE' | 'VIDEO'
    url: string
    altText?: string
    sortIndex: number
  }>
  className?: string
}

export const CustomerMediaGallery: React.FC<CustomerMediaGalleryProps> = ({
  media,
  className = '',
}) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)

  if (!media || media.length === 0) {
    return null
  }

  const selectedMedia = media[selectedMediaIndex] || media[0]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Display */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {selectedMedia.kind === 'IMAGE' ? (
          <img
            src={selectedMedia.url}
            alt={selectedMedia.altText || ''}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={selectedMedia.url}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        )}
      </div>

      {/* Thumbnail Row */}
      {media.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedMediaIndex(index)}
              className={`
                flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2
                ${index === selectedMediaIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                transition-colors
              `}
            >
              {item.kind === 'IMAGE' ? (
                <img
                  src={item.url}
                  alt={item.altText || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                    ▶
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
