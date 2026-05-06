import React, { useState } from 'react'
import { MediaPreviewCard } from './MediaPreviewCard'

interface MediaSortableGridProps {
  media: Array<{
    id: string
    kind: 'IMAGE' | 'VIDEO'
    url: string
    altText?: string
    sortIndex: number
  }>
  onReorder?: (mediaIds: string[]) => void
  onDelete?: (mediaId: string) => void
  onPreview?: (media: any) => void
  disabled?: boolean
}

export const MediaSortableGrid: React.FC<MediaSortableGridProps> = ({
  media,
  onReorder,
  onDelete,
  onPreview,
  disabled = false,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const handleSelect = (mediaId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return

    if (e.shiftKey && selectedItems.length > 0) {
      // Shift+click for range selection
      const lastSelectedIndex = media.findIndex(m => m.id === selectedItems[selectedItems.length - 1])
      const currentIndex = media.findIndex(m => m.id === mediaId)
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex)
        const end = Math.max(lastSelectedIndex, currentIndex)
        const rangeIds = media.slice(start, end + 1).map(m => m.id)
        setSelectedItems(rangeIds)
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click for multi-select
      setSelectedItems(prev => 
        prev.includes(mediaId) 
          ? prev.filter(id => id !== mediaId)
          : [...prev, mediaId]
      )
    } else {
      // Single click
      setSelectedItems([mediaId])
    }
  }

  const handleReorder = (direction: 'up' | 'down') => {
    if (disabled || !onReorder || selectedItems.length === 0) return

    const newMedia = [...media]
    const indices = selectedItems.map(id => media.findIndex(m => m.id === id)).sort()

    if (direction === 'up' && indices[0] > 0) {
      // Move selected items up
      indices.forEach((index, i) => {
        const targetIndex = index - 1 - i
        if (targetIndex >= 0) {
          [newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]]
        }
      })
    } else if (direction === 'down' && indices[indices.length - 1] < media.length - 1) {
      // Move selected items down
      indices.reverse().forEach((index, i) => {
        const targetIndex = index + 1 + i
        if (targetIndex < media.length) {
          [newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]]
        }
      })
    }

    const reorderedIds = newMedia.map(m => m.id)
    onReorder(reorderedIds)
    setSelectedItems([])
  }

  const handleBulkReorder = async () => {
    if (disabled || !onReorder || selectedItems.length === 0) return

    const reorderedMedia = selectedItems
      .map(id => media.find(m => m.id === id))
      .filter(Boolean)
      .concat(media.filter(m => !selectedItems.includes(m.id)))

    const reorderedIds = reorderedMedia.map(m => m!.id)
    onReorder(reorderedIds)
    setSelectedItems([])
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📸</div>
        <div>No media uploaded yet</div>
        <div className="text-sm">Upload images or videos to get started</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {selectedItems.length > 0 && (
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
          <span className="text-sm text-blue-700">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => handleReorder('up')}
            disabled={disabled}
            className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ↑ Up
          </button>
          <button
            onClick={() => handleReorder('down')}
            disabled={disabled}
            className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ↓ Down
          </button>
          <button
            onClick={handleBulkReorder}
            disabled={disabled}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Move to Top
          </button>
          <button
            onClick={() => setSelectedItems([])}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item, index) => (
          <div
            key={item.id}
            onClick={(e) => handleSelect(item.id, e)}
            className={`
              relative cursor-pointer
              ${selectedItems.includes(item.id) ? 'ring-2 ring-blue-500 rounded-lg' : ''}
            `}
          >
            <MediaPreviewCard
              media={item}
              isPrimary={index === 0}
              onDelete={() => onDelete?.(item.id)}
              onPreview={() => onPreview?.(item)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
