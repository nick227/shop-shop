import React, { useCallback, useEffect, useState } from 'react'
import { EnhancedMediaUploader } from './EnhancedMediaUploader'
import { EnhancedMediaPreviewCard } from './EnhancedMediaPreviewCard'
import { Search, Grid, Trash2, SortAsc, SortDesc } from 'lucide-react'
import { authFetch } from '@shared/lib/auth/authFetch'
import { readHttpErrorFromResponse } from '@api/readHttpError'
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'

type EntityThumbnailMode = 'store' | 'item'

interface EnhancedMediaGalleryManagerProps {
  storeId?: string
  itemId?: string
  disabled?: boolean
  maxFiles?: number

  thumbnailUrl?: string
  onThumbnailChange?: (url: string) => void
  thumbnailLabel?: string

  /** Queued files before store/item exists (create flows); paired with onPendingScopedMediaFilesChange */
  pendingScopedMediaFiles?: File[]
  onPendingScopedMediaFilesChange?: (files: File[]) => void
}

interface MediaItem {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  url: string
  altText?: string
  sortIndex: number
  size?: number
  createdAt?: string
}

type SortOrder = 'asc' | 'desc'
type FilterType = 'all' | 'images' | 'videos'

export const EnhancedMediaGalleryManager: React.FC<EnhancedMediaGalleryManagerProps> = ({
  storeId,
  itemId,
  disabled = false,
  maxFiles = 100,
  thumbnailUrl,
  onThumbnailChange,
  thumbnailLabel,
  pendingScopedMediaFiles,
  onPendingScopedMediaFilesChange,
}) => {
  const pendingScopedCount = pendingScopedMediaFiles?.length ?? 0

  const FAILED_TO_DELETE_MEDIA = 'Failed to delete media'
  const readErrorMessage = async (response: Response, fallbackMessage: string): Promise<string> => {
    const { message, body } = await readHttpErrorFromResponse(response.clone())
    const bodyError = body && typeof body.error === 'string' ? body.error : undefined
    return bodyError ?? message ?? fallbackMessage
  }

  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadMedia = useCallback(async () => {
    // Don't load media if we don't have storeId or itemId
    if (!storeId && !itemId) {
      setMedia([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(undefined)

      const params = new URLSearchParams()
      if (storeId) params.append('storeId', storeId)
      if (itemId) params.append('itemId', itemId)

      const response = await authFetch(`/api/media?${params.toString()}`)

      if (!response.ok) {
        const { message } = await readHttpErrorFromResponse(response.clone())
        throw new Error(message || `Failed to load media: ${response.status} ${response.statusText}`)
      }

      const text = await response.text().catch(() => '')
      try {
        const list = JSON.parse(text) as { data?: MediaItem[] }
        const rows = list.data ?? []
        setMedia(
          rows.map((item) => ({
            ...item,
            url: resolveBrowserAssetUrl(String(item.url ?? '')),
          })),
        )
      } catch {
        throw new Error(`Failed to parse /api/media response as JSON. Body starts with: ${JSON.stringify(text.slice(0, 60))}`)
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [itemId, storeId])

  // Load media on mount / when params change
  useEffect(() => {
    void loadMedia()
  }, [loadMedia])

  const handleUploadComplete = (_newMediaItems: MediaItem[]) => {
    // Backend may assign canonical sortIndex / return partial data.
    // Always reload from server to keep order consistent.
    void loadMedia()
  }

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage)
  }


  const handleDelete = async (mediaId: string) => {
    try {
      const response = await authFetch(`/api/media/${mediaId}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, FAILED_TO_DELETE_MEDIA))
      }

      // Reload media to get updated sort indexes from backend
      await loadMedia()
      setSelectedItems(prev => prev.filter(id => id !== mediaId))
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : FAILED_TO_DELETE_MEDIA)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      return
    }

    if (!confirm(`Delete ${selectedItems.length} selected media items?`)) {
      return
    }

    try {
      const deletePromises = selectedItems.map(id => 
        authFetch(`/api/media/${id}`, { method: 'DELETE' })
      )

      const responses = await Promise.all(deletePromises)
      const failed = responses.find(r => !r.ok)
      if (failed) {
        throw new Error(await readErrorMessage(failed, 'Failed to delete one or more media items'))
      }
      
      setSelectedItems([])
      // Reload media to get updated sort indexes from backend
      await loadMedia()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : FAILED_TO_DELETE_MEDIA)
    }
  }

  const handleSetPrimary = async (mediaId: string) => {
    try {
      const selected = media.find(m => m.id === mediaId)
      if (!selected) throw new Error('Media not found')

      // Update thumbnail URL if callback is provided
      if (onThumbnailChange) {
        onThumbnailChange(selected.url)
      }

      const ordered = [
        selected,
        ...media
          .filter(m => m.id !== mediaId)
          .sort((a, b) => a.sortIndex - b.sortIndex),
      ].map((item, index) => ({ ...item, sortIndex: index }))

      // Update backend with new order
      const response = await authFetch('/api/media/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ mediaIds: ordered.map(m => m.id) }),
      })

      if (!response.ok) {
        throw new Error('Failed to set primary media')
      }

      // Reload from server to ensure canonical order
      await loadMedia()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to set primary media')
    }
  }

  const handlePreview = (mediaItem: MediaItem) => {
    // Enhanced preview with modal (simplified for now)
    window.open(mediaItem.url, '_blank')
  }

  const toggleSelection = (mediaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedItems(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    )
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  // Filter and sort media
  const filteredMedia = media
    .filter(item => {
      if (filterType === 'images') return item.kind === 'IMAGE'
      if (filterType === 'videos') return item.kind === 'VIDEO'
      return true
    })
    .filter(item => 
      searchQuery === '' || 
      (item.altText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      item.kind.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.sortIndex - b.sortIndex
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const canUploadMore = media.length + pendingScopedCount < maxFiles
  const stats = media.reduce((acc, m) => {
    acc.total += 1
    if (m.kind === 'IMAGE') acc.images += 1
    else if (m.kind === 'VIDEO') acc.videos += 1
    return acc
  }, { total: 0, images: 0, videos: 0 })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        <div className="text-gray-500">Loading your media gallery...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
        <button
          onClick={() => void loadMedia()}
          disabled={disabled}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Media Gallery</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <span>📊</span>
                <span>{stats.total} total</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>📷</span>
                <span>{stats.images} images</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🎥</span>
                <span>{stats.videos} videos</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>💾</span>
                <span>{stats.total}/{maxFiles} used</span>
              </span>
            </div>
          </div>
          
          {!disabled && canUploadMore && (
            <div className="text-sm text-blue-600 font-medium">
              {onThumbnailChange 
                ? "⭐ Selected thumbnail."
                : "⭐ First image is primary"
              }
            </div>
          )}
        </div>
      </div>

      {/* Current Thumbnail Preview */}
      {thumbnailUrl && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Current {thumbnailLabel ?? 'thumbnail'}
              </h4>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={resolveBrowserAssetUrl(thumbnailUrl)}
                    alt="Current thumbnail"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 shadow-sm"
                  />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Active
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">This is the active thumbnail</div>
                  <div>Used on cards and analytics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Search */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Media</option>
            <option value="images">Images Only</option>
            <option value="videos">Videos Only</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </button>

          <div className="flex items-center border border-gray-300 rounded-lg">
            <div className="p-2 bg-gray-200" title="Grid view">
              <Grid className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 font-medium">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => void handleBulkDelete()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!disabled && canUploadMore && (
        <EnhancedMediaUploader
          storeId={storeId}
          itemId={itemId}
          onUploadComplete={handleUploadComplete}
          onError={handleUploadError}
          maxFiles={maxFiles - media.length - pendingScopedCount}
          disabled={disabled}
          pendingUntilScoped={
            !storeId &&
            !itemId &&
            onPendingScopedMediaFilesChange !== undefined
              ? {
                  files: pendingScopedMediaFiles ?? [],
                  onFilesChange: onPendingScopedMediaFilesChange,
                }
              : undefined
          }
        />
      )}

      {/* Upload Limit Reached */}
      {!disabled && !canUploadMore && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📦</span>
            <span>Maximum media limit reached ({maxFiles} items). Delete some items to upload more.</span>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📸</div>
          <div className="text-xl font-medium text-gray-700 mb-2">
            {searchQuery || filterType !== 'all' ? 'No media found' : 'No media uploaded yet'}
          </div>
          <div className="text-gray-500">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Upload images or videos to get started'
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={(e) => toggleSelection(item.id, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleSelection(item.id)
                }
              }}
              role="button"
              tabIndex={0}
              className={`
                relative cursor-pointer text-left
                ${selectedItems.includes(item.id) ? 'ring-2 ring-blue-500 rounded-xl' : ''}
              `}
            >
              <EnhancedMediaPreviewCard
                media={item}
                isPrimary={
                  thumbnailUrl
                    ? resolveBrowserAssetUrl(thumbnailUrl) === item.url
                    : item.sortIndex === 0
                }
                onDelete={() => void handleDelete(item.id)}
                onPreview={() => handlePreview(item)}
                onSetPrimary={() => void handleSetPrimary(item.id)}
                disabled={disabled}
                setPrimaryLabel={onThumbnailChange ? 'Set as thumbnail' : 'Set as primary'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
