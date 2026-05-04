/**
 * Bundle Item Selector Component
 * Allows selection of items for a bundle with quantities
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@shared/ui/primitives'
import { Input } from '@shared/ui/primitives'
import { Card } from '@shared/ui/primitives'
import { Badge } from '@shared/ui/primitives'
import { useItems } from '@shared/hooks/generated'
import type { ItemResponse } from '@api/types'

// Utility to handle cents vs dollars ambiguity
const toDollars = (v: string | number | undefined): number => {
  if (v === undefined) return 0
  if (typeof v === 'string') {
    // eslint-disable-next-line unicorn/prefer-string-replace-all
    const n = Number(v.replace(/[^\d.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  // Treat large integers as cents
  return v > 100 && Number.isInteger(v) ? v / 100 : v
}

// Extended item type with imageUrl for future backend support
type ItemWithImage = ItemResponse & { imageUrl?: string }

// Type guard for safe image access
const hasImageUrl = (item: ItemResponse): item is ItemWithImage => {
  return 'imageUrl' in item && typeof (item as ItemWithImage).imageUrl === 'string'
}

// Helper to get image URL from media field
const getItemImageUrl = (item: ItemResponse): string | undefined => {
  // Check if item has imageUrl property (future backend support)
  if (hasImageUrl(item)) {
    return item.imageUrl
  }
  
  // Fallback to media field from SDK
  const mediaField = 'media' in item ? item.media : undefined
  if (typeof mediaField === 'string' && mediaField.trim()) {
    return mediaField
  }
  
  return undefined
}

interface BundleItem {
  itemId: string
  quantity: number
  sortIndex?: number
}

interface BundleItemSelectorProps {
  readonly storeId: string
  readonly items: BundleItem[]
  readonly onChange: (items: BundleItem[]) => void
  readonly error?: string
  readonly className?: string
}

export function BundleItemSelector({
  storeId,
  items,
  onChange,
  error,
  className = ''
}: BundleItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<BundleItem[]>(items)

  // Update selectedItems when parent items prop changes
  useEffect(() => {
    setSelectedItems(items)
  }, [items])

  const itemsQuery = useItems({ storeId })
  const { data: rawItems, isLoading, error: itemsError } = itemsQuery ?? { data: undefined, isLoading: false, error: undefined }
  
  // Validate and normalize items data
  const availableItems = useMemo(() => {
    if (!Array.isArray(rawItems)) {
      console.warn('useItems returned non-array data:', rawItems)
      return []
    }
    return rawItems
  }, [rawItems])

  // Memoized filtered items for better performance
  const filteredItems = useMemo(() => {
    if (!searchTerm) return availableItems
    
    const searchLower = searchTerm.toLowerCase()
    return availableItems.filter(item =>
      (item.title ?? '').toLowerCase().includes(searchLower) ||
      (item.description ?? '').toLowerCase().includes(searchLower)
    )
  }, [availableItems, searchTerm])

  // Update parent when selected items change (with deep comparison to prevent loops)
  useEffect(() => {
    // Deep comparison to prevent unnecessary onChange calls
    const hasChanged = selectedItems.length !== items.length || 
      selectedItems.some((item, index) => {
        const parentItem = items[index]
        return !parentItem || 
          item.itemId !== parentItem.itemId || 
          item.quantity !== parentItem.quantity ||
          item.sortIndex !== parentItem.sortIndex
      })
    
    if (hasChanged) {
      onChange(selectedItems)
    }
  }, [selectedItems, items, onChange])

  // Memoized handlers for better performance
  const handleAddItem = useCallback((item: ItemResponse) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(selected => selected.itemId === (item as unknown as { id: string }).id)
      
      // eslint-disable-next-line
      if (existingItem) {
        // Update quantity if item already exists
        return prev.map(selected =>
          selected.itemId === (item as unknown as { id: string }).id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      } else {
        // Add new item
        return [...prev, {
          itemId: (item as unknown as { id: string }).id,
          quantity: 1,
          sortIndex: prev.length
        }]
      }
    })
  }, [])

  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const filtered = prev.filter(item => item.itemId !== itemId)
      // Reindex sortIndex to maintain contiguous ordering
      return filtered.map((item, index) => ({
        ...item,
        sortIndex: index
      }))
    })
  }, [])

  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }

    setSelectedItems(prev => prev.map(item =>
      item.itemId === itemId
        ? { ...item, quantity }
        : item
    ))
  }, [handleRemoveItem])

  // Memoized item lookup map for better performance
  const itemsById = useMemo(() => {
    const map = new Map<string, ItemResponse>()
    for (const item of availableItems) {
      map.set((item as unknown as { id: string }).id, item)
    }
    return map
  }, [availableItems])

  const getSelectedItem = useCallback((itemId: string) => {
    return itemsById.get(itemId) ?? undefined
  }, [itemsById])

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Search */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search items to add to bundle"
        />
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-neutral-900 mb-4">Selected Items ({selectedItems.length})</h4>
          <div className="flex flex-col gap-3">
            {selectedItems
              .filter((bundleItem) => getSelectedItem(bundleItem.itemId))
              .map((bundleItem) => {
                const item = getSelectedItem(bundleItem.itemId)!

                return (
                <Card key={bundleItem.itemId} className="flex items-center justify-between p-4 border border-neutral-300 rounded-lg">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      {getItemImageUrl(item) ? (
                        <img src={getItemImageUrl(item)} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-neutral-900 truncate">{item.title}</h5>
                      <p className="text-xs text-neutral-600">${toDollars(item.price).toFixed(2)} each</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => handleQuantityChange(bundleItem.itemId, bundleItem.quantity - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={bundleItem.quantity}
                        onChange={(e) => {
                          const value = e.target.value
                          // Allow empty string while typing
                          if (value === '') {
                            return
                          }
                          // Parse and clamp to valid range
                          const parsed = Number.parseInt(value, 10)
                          if (!Number.isNaN(parsed)) {
                            const clamped = Math.max(1, Math.min(999, parsed))
                            handleQuantityChange(bundleItem.itemId, clamped)
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          // Normalize on blur - clamp to valid range
                          const parsed = Number.parseInt(value, 10)
                          if (Number.isNaN(parsed) || parsed < 1) {
                            handleQuantityChange(bundleItem.itemId, 1)
                          } else {
                            const clamped = Math.max(1, Math.min(999, parsed))
                            handleQuantityChange(bundleItem.itemId, clamped)
                          }
                        }}
                        className="w-16 text-center"
                      />
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => handleQuantityChange(bundleItem.itemId, bundleItem.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleRemoveItem(bundleItem.itemId)}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
                )
              })}
          </div>
        </div>
      )}

      {/* Available Items */}
      <div>
        <h4 className="text-base font-semibold text-neutral-900 mb-4">Available Items</h4>
        {(() => {
          if (itemsError) {
            return (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                <p className="text-sm">Failed to load items. Please try again.</p>
              </div>
            )
          }
          
          if (isLoading) {
            return (
              <div className="text-center p-8 text-neutral-600">
                <p>Loading items...</p>
              </div>
            )
          }
          
          if (filteredItems.length === 0) {
            return (
              <div className="text-center p-8 text-neutral-600">
                <p>No items found{searchTerm ? ` matching "${searchTerm}"` : ''}</p>
              </div>
            )
          }
          
          return (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.some(selected => selected.itemId === (item as unknown as { id: string }).id)
              
              return (
                <Card 
                  key={(item as unknown as { id: string }).id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${isSelected ? 'bg-green-50 border-green-300' : 'border-neutral-300'}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      {getItemImageUrl(item) ? (
                        <img src={getItemImageUrl(item)} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    
                    <div className="bundle-item-selector__item-details">
                      <h5>{item.title}</h5>
                      <p>${toDollars(item.price).toFixed(2)}</p>
                      {item.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <Badge variant="success">
                        Added
                      </Badge>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => handleAddItem(item)}
                      >
                        Add to Bundle
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
          )
        })()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

