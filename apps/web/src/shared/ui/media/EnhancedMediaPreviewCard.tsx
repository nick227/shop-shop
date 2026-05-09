import React, { useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Trash2, Eye, Star, Edit2 } from 'lucide-react'

interface EnhancedMediaPreviewCardProps {
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
  onSetPrimary?: () => void
  onEditAlt?: () => void
  disabled?: boolean
  setPrimaryLabel?: string
}

export const EnhancedMediaPreviewCard: React.FC<EnhancedMediaPreviewCardProps> = ({
  media,
  isPrimary = false,
  onDelete,
  onPreview,
  onSetPrimary,
  onEditAlt,
  disabled = false,
  setPrimaryLabel = 'Set as primary',
}) => {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onDelete && confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      onDelete()
    }
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onPreview) {
      onPreview()
    }
  }

  const handleSetPrimary = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onSetPrimary) {
      onSetPrimary()
    }
  }

  const handleEditAlt = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onEditAlt) {
      onEditAlt()
    }
  }

  const handleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = e.currentTarget as HTMLVideoElement
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play()
      setIsPlaying(true)
    }
  }

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = e.currentTarget.parentElement?.querySelector('video') as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div 
      className="relative group bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg flex items-center space-x-1">
          <Star className="w-3 h-3" />
          <span>Primary</span>
        </div>
      )}

      {/* Media Content */}
      <div 
        className="aspect-square cursor-pointer relative"
        onClick={handlePreview}
      >
        {media.kind === 'IMAGE' ? (
          !imageError ? (
            <>
              <img
                src={media.url}
                alt={media.altText || ''}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              
              {/* Image Overlay on Hover */}
              {isHovered && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-3xl mb-2">🖼️</div>
                <div className="text-sm">Image failed to load</div>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full bg-gray-900 relative">
            <video
              src={media.url}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              onMouseEnter={(e) => {
                e.currentTarget.play()
                setIsPlaying(true)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                setIsPlaying(false)
              }}
              onClick={handleVideoPlay}
            />
            
            {/* Video Controls */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <button
                onClick={handleMuteToggle}
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                {isPlaying ? '⏸️' : '▶️'} Video
              </div>
            </div>

            {/* Play/Pause Overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 rounded-full p-3">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-gray-800" />
                  ) : (
                    <Play className="w-6 h-6 text-gray-800" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Overlay */}
      {!disabled && (
        <div className="absolute top-3 right-3 z-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
          <div className="flex flex-col space-y-2">
            {/* Preview/Expand */}
            <button
              onClick={handlePreview}
              className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Set Primary (if not already primary) */}
            {!isPrimary && onSetPrimary && (
              <button
                onClick={handleSetPrimary}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
                title={setPrimaryLabel}
              >
                <Star className="w-4 h-4" />
              </button>
            )}

            {/* Edit Alt Text */}
            {onEditAlt && (
              <button
                onClick={handleEditAlt}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
                title="Edit alt text"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-lg"
              title="Delete media"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Media Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="text-xs">
              {media.kind === 'IMAGE' ? '📷' : '🎥'}
            </div>
            <div className="text-xs font-medium truncate">
              {media.altText || `${media.kind} ${media.sortIndex + 1}`}
            </div>
          </div>
          
          {/* File Type Badge */}
          <div className="bg-black bg-opacity-50 text-xs px-2 py-1 rounded">
            {media.kind}
          </div>
        </div>
      </div>

      {/* Hover Indicator */}
      {isHovered && (
        <div className="absolute top-1 left-1 right-1 bottom-1 border-2 border-blue-400 rounded-xl pointer-events-none" />
      )}
    </div>
  )
}
