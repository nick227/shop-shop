import React, { useState, useEffect } from 'react'
import { MediaUploader } from './MediaUploader'
import { MediaSortableGrid } from './MediaSortableGrid'

interface MediaGalleryManagerProps {
  storeId?: string
  itemId?: string
  disabled?: boolean
  maxFiles?: number
}

interface MediaItem {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  url: string
  altText?: string
  sortIndex: number
}

export const MediaGalleryManager: React.FC<MediaGalleryManagerProps> = ({
  storeId,
  itemId,
  disabled = false,
  maxFiles = 100,
}) => {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Load media on mount
  useEffect(() => {
    loadMedia()
  }, [storeId, itemId])

  const loadMedia = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (storeId) params.append('storeId', storeId)
      if (itemId) params.append('itemId', itemId)

      const response = await fetch(`/media?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load media')
      }

      const data = await response.json()
      setMedia(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (newMediaItems: MediaItem[]) => {
    setMedia(prev => [...prev, ...newMediaItems])
  }

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleDelete = async (mediaId: string) => {
    try {
      const response = await fetch(`/media/${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete media')
      }

      // Remove from local state
      setMedia(prev => prev.filter(item => item.id !== mediaId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media')
    }
  }

  const handleReorder = async (mediaIds: string[]) => {
    try {
      const response = await fetch('/media/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaIds }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder media')
      }

      // Update local state with new order
      const reorderedMedia = mediaIds.map((id, index) => {
        const item = media.find(m => m.id === id)
        return item ? { ...item, sortIndex: index } : null
      }).filter(Boolean) as MediaItem[]

      setMedia(reorderedMedia)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder media')
    }
  }

  const handlePreview = (mediaItem: MediaItem) => {
    // Simple preview - could be enhanced with a modal later
    if (mediaItem.kind === 'IMAGE') {
      window.open(mediaItem.url, '_blank')
    } else {
      window.open(mediaItem.url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading media...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={loadMedia}
          disabled={disabled}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    )
  }

  const canUploadMore = media.length < maxFiles

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Media Gallery</h3>
          <p className="text-sm text-gray-500">
            {media.length} of {maxFiles} items used
          </p>
        </div>
        {!disabled && canUploadMore && (
          <div className="text-sm text-gray-500">
            First item is primary
          </div>
        )}
      </div>

      {/* Upload Area */}
      {!disabled && canUploadMore && (
        <MediaUploader
          storeId={storeId}
          itemId={itemId}
          onUploadComplete={handleUploadComplete}
          onError={handleUploadError}
          maxFiles={maxFiles - media.length}
          disabled={uploading}
        />
      )}

      {/* Upload Limit Reached */}
      {!disabled && !canUploadMore && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Maximum media limit reached ({maxFiles} items). Delete some items to upload more.
        </div>
      )}

      {/* Media Grid */}
      <MediaSortableGrid
        media={media}
        onReorder={handleReorder}
        onDelete={handleDelete}
        onPreview={handlePreview}
        disabled={disabled}
      />
    </div>
  )
}
