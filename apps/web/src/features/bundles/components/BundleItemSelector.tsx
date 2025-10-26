/**
 * Bundle Item Selector Component
 * Allows selection of items for a bundle with quantities
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { useItems } from '../../../hooks/generated'
import type { Item } from '../../../api/types'

interface BundleItem {
  itemId: string
  quantity: number
  sortIndex: number
}

interface BundleItemSelectorProps {
  storeId: string
  items: BundleItem[]
  onChange: (items: BundleItem[]) => void
  error?: string
  className?: string
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

  const { data: availableItems = [], isLoading } = useItems({ storeId })

  // Memoized filtered items for better performance
  const filteredItems = useMemo(() => {
    if (!searchTerm) return availableItems
    
    const searchLower = searchTerm.toLowerCase()
    return availableItems.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    )
  }, [availableItems, searchTerm])

  // Update parent when selected items change
  useEffect(() => {
    onChange(selectedItems)
  }, [selectedItems, onChange])

  // Memoized handlers for better performance
  const handleAddItem = useCallback((item: Item) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(selected => selected.itemId === item.id)
      
      if (existingItem) {
        // Update quantity if item already exists
        return prev.map(selected =>
          selected.itemId === item.id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      } else {
        // Add new item
        return [...prev, {
          itemId: item.id,
          quantity: 1,
          sortIndex: prev.length
        }]
      }
    })
  }, [])

  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.itemId !== itemId))
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

  const getSelectedItem = (itemId: string) => {
    return availableItems.find(item => item.id === itemId)
  }

  return (
    <div className={`bundle-item-selector ${className}`}>
      {/* Search */}
      <div className="bundle-item-selector__search">
        <Input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="bundle-item-selector__selected">
          <h4>Selected Items ({selectedItems.length})</h4>
          <div className="bundle-item-selector__selected-list">
            {selectedItems.map((bundleItem) => {
              const item = getSelectedItem(bundleItem.itemId)
              if (!item) return null

              return (
                <Card key={bundleItem.itemId} className="bundle-item-selector__selected-item">
                  <div className="bundle-item-selector__item-info">
                    <div className="bundle-item-selector__item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} />
                      ) : (
                        <div className="bundle-item-selector__item-placeholder">
                          📦
                        </div>
                      )}
                    </div>
                    
                    <div className="bundle-item-selector__item-details">
                      <h5>{item.title}</h5>
                      <p>${item.price.toFixed(2)} each</p>
                    </div>
                  </div>

                  <div className="bundle-item-selector__item-controls">
                    <div className="bundle-item-selector__quantity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(bundleItem.itemId, bundleItem.quantity - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={bundleItem.quantity}
                        onChange={(e) => handleQuantityChange(bundleItem.itemId, parseInt(e.target.value) || 1)}
                        className="bundle-item-selector__quantity-input"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(bundleItem.itemId, bundleItem.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
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
      <div className="bundle-item-selector__available">
        <h4>Available Items</h4>
        {isLoading ? (
          <div className="bundle-item-selector__loading">
            <p>Loading items...</p>
          </div>
        ) : (
          <div className="bundle-item-selector__available-list">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.some(selected => selected.itemId === item.id)
              
              return (
                <Card 
                  key={item.id} 
                  className={`bundle-item-selector__available-item ${isSelected ? 'bundle-item-selector__available-item--selected' : ''}`}
                >
                  <div className="bundle-item-selector__item-info">
                    <div className="bundle-item-selector__item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} />
                      ) : (
                        <div className="bundle-item-selector__item-placeholder">
                          📦
                        </div>
                      )}
                    </div>
                    
                    <div className="bundle-item-selector__item-details">
                      <h5>{item.title}</h5>
                      <p>${item.price.toFixed(2)}</p>
                      {item.description && (
                        <p className="bundle-item-selector__item-description">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bundle-item-selector__item-actions">
                    {isSelected ? (
                      <Badge variant="success" size="sm">
                        Added
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
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
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bundle-item-selector__error">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

// Bundle Item Selector Styles
export const bundleItemSelectorStyles = `
.bundle-item-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bundle-item-selector__search {
  width: 100%;
}

.bundle-item-selector__selected h4,
.bundle-item-selector__available h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bundle-item-selector__selected-list,
.bundle-item-selector__available-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bundle-item-selector__selected-item,
.bundle-item-selector__available-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.bundle-item-selector__available-item--selected {
  background: var(--success-background);
  border-color: var(--success-color);
}

.bundle-item-selector__item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.bundle-item-selector__item-image {
  width: 3rem;
  height: 3rem;
  border-radius: 0.375rem;
  overflow: hidden;
  flex-shrink: 0;
}

.bundle-item-selector__item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bundle-item-selector__item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--muted-background);
  font-size: 1.25rem;
}

.bundle-item-selector__item-details {
  flex: 1;
  min-width: 0;
}

.bundle-item-selector__item-details h5 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bundle-item-selector__item-details p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.bundle-item-selector__item-description {
  margin-top: 0.25rem !important;
  font-size: 0.75rem !important;
  line-height: 1.4;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bundle-item-selector__item-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bundle-item-selector__quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bundle-item-selector__quantity-input {
  width: 4rem;
  text-align: center;
}

.bundle-item-selector__item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bundle-item-selector__loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.bundle-item-selector__error {
  padding: 0.75rem;
  background: var(--error-background);
  border: 1px solid var(--error-color);
  border-radius: 0.375rem;
  color: var(--error-color);
}

.bundle-item-selector__error p {
  margin: 0;
  font-size: 0.875rem;
}
`
