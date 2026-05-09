import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  EnhancedMediaUploader,
  type EnhancedMediaUploaderHandle,
} from './EnhancedMediaUploader'
import { EnhancedMediaPreviewCard } from './EnhancedMediaPreviewCard'
import { Search, Grid, Trash2, SortAsc, SortDesc } from 'lucide-react'
import { authFetch } from '@shared/lib/auth/authFetch'
import { readHttpErrorFromResponse } from '@api/readHttpError'
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'

function pickThumbnailUrlFromUploadResults(items: unknown[]): string | undefined {
  for (const item of items) {
    if (item && typeof item === 'object' && 'kind' in item && 'url' in item) {
      const o = item as { kind?: unknown; url?: unknown }
      if (o.kind === 'IMAGE' && typeof o.url === 'string') return o.url
    }
  }
  for (const item of items) {
    if (item && typeof item === 'object' && 'url' in item) {
      const u = (item as { url?: unknown }).url
      if (typeof u === 'string') return u
    }
  }
  return undefined
}

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
  const thumbnailPickerRef = useRef<HTMLDivElement>(null)
  const uploaderRef = useRef<EnhancedMediaUploaderHandle>(null)
  const assignThumbnailAfterNextUploadRef = useRef(false)

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

  const handleUploadComplete = (newMediaItems: unknown[]) => {
    void loadMedia()
    if (assignThumbnailAfterNextUploadRef.current && onThumbnailChange) {
      assignThumbnailAfterNextUploadRef.current = false
      const url = pickThumbnailUrlFromUploadResults(newMediaItems)
      if (url) onThumbnailChange(url)
    }
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

  const handleRemoveThumbnail = () => {
    if (disabled || !onThumbnailChange) return
    onThumbnailChange('')
  }

  const handleChangeThumbnail = () => {
    if (disabled) return
    if (!canUploadMore) {
      thumbnailPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    assignThumbnailAfterNextUploadRef.current = true
    uploaderRef.current?.openFilePicker()
  }

  const linkLikeButtonClass =
    'font-medium text-green-800 underline decoration-green-600/50 underline-offset-2 hover:text-green-900 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50'

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 animate-spin border-t-transparent" />
        <div className="text-gray-500">Loading your media gallery...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="px-6 py-4 text-red-700 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
        <button
          onClick={() => void loadMedia()}
          disabled={disabled}
          className="px-6 py-3 text-white bg-red-500 rounded-lg transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">Media Gallery</h3>
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
          
        </div>
      </div>

      {/* Current Thumbnail Preview */}
      {thumbnailUrl && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="mb-2 text-lg font-semibold text-gray-800">
                Current {thumbnailLabel ?? 'thumbnail'}
              </h4>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={resolveBrowserAssetUrl(thumbnailUrl)}
                    alt="Current thumbnail"
                    className="object-cover w-20 h-20 rounded-lg border-2 border-green-300 shadow-sm"
                  />
                  <div className="absolute -top-2 -right-2 px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                    Active
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-gray-600">
                  <button
                    type="button"
                    disabled={disabled || !onThumbnailChange}
                    onClick={handleRemoveThumbnail}
                    className={linkLikeButtonClass}
                  >
                    Remove
                  </button>
                  <span aria-hidden className="text-gray-400">
                    /
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={handleChangeThumbnail}
                    className={linkLikeButtonClass}
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={thumbnailPickerRef} className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap gap-4 justify-between items-center p-4 bg-gray-50 rounded-lg">
        {/* Search */}
        <div className="flex flex-1 items-center space-x-2 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Media</option>
            <option value="images">Images Only</option>
            <option value="videos">Videos Only</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg border border-gray-300 transition-colors hover:bg-gray-100"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </button>

          <div className="flex items-center rounded-lg border border-gray-300">
            <div className="p-2 bg-gray-200" title="Grid view">
              <Grid className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-700">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => void handleBulkDelete()}
                className="flex items-center px-4 py-2 space-x-2 text-white bg-red-500 rounded-lg transition-colors hover:bg-red-600"
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
          ref={uploaderRef}
          storeId={storeId}
          itemId={itemId}
          onUploadComplete={handleUploadComplete}
          onError={handleUploadError}
          maxFiles={maxFiles - media.length - pendingScopedCount}
          disabled={disabled}
          onFilePickerCancel={() => {
            assignThumbnailAfterNextUploadRef.current = false
          }}
          onScopedFilesAccepted={(accepted) => {
            if (!assignThumbnailAfterNextUploadRef.current || !onThumbnailChange) return
            assignThumbnailAfterNextUploadRef.current = false
            const thumbFile =
              accepted.find((f) => f.type.startsWith('image/')) ?? accepted[0]
            if (thumbFile) onThumbnailChange(URL.createObjectURL(thumbFile))
          }}
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
        <div className="px-6 py-4 text-yellow-800 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📦</span>
            <span>Maximum media limit reached ({maxFiles} items). Delete some items to upload more.</span>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">📸</div>
          <div className="mb-2 text-xl font-medium text-gray-700">
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                onDelete={() => void handleDelete(item.id)}
                onPreview={() => handlePreview(item)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
