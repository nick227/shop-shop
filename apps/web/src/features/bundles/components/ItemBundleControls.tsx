/**
 * Item Bundle Controls Component
 * Adds bundle management controls to item cards
 */
import React, { useState } from 'react'
import { Button } from '@components/ui/Button'
import { Dropdown } from '@components/ui/Dropdown'
import { Badge } from '@components/ui/Badge'
import { useBundles } from '@hooks/generated'
import { useBundleManagement } from '../hooks/useBundleManagement'
import type { Item, Bundle } from '../../../api/types'

interface ItemBundleControlsProps {
  item: Item
  storeId: string
  onBundleCreated?: (bundle: Bundle) => void
  className?: string
}

export function ItemBundleControls({
  item,
  storeId,
  onBundleCreated,
  className = ''
}: ItemBundleControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreatingBundle, setIsCreatingBundle] = useState(false)

  const { data: bundles = [] } = useBundles({ storeId })
  const { createBundle } = useBundleManagement({ storeId })

  // Filter bundles that don't already contain this item
  const availableBundles = bundles.filter(bundle => 
    !bundle.items?.some(bundleItem => bundleItem.itemId === item.id)
  )

  const handleAddToBundle = async (bundle: Bundle) => {
    try {
      // Add item to existing bundle
      const updatedItems = [
        ...(bundle.items || []),
        {
          itemId: item.id,
          quantity: 1,
          sortIndex: bundle.items?.length || 0
        }
      ]

      await createBundle({
        ...bundle,
        items: updatedItems
      })

      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to add item to bundle:', error)
      alert('Failed to add item to bundle. Please try again.')
    }
  }

  const handleCreateNewBundle = async () => {
    setIsCreatingBundle(true)
    
    try {
      // Create new bundle with this item
      const newBundle = await createBundle({
        name: `${item.title} Bundle`,
        description: `Bundle featuring ${item.title}`,
        imageUrl: item.imageUrl,
        isActive: true,
        sortIndex: 0,
        items: [{
          itemId: item.id,
          quantity: 1,
          sortIndex: 0
        }],
        pricing: {
          pricingType: 'FIXED_PRICE',
          fixedPrice: item.price * 0.9, // 10% discount
          showSavings: true,
          savingsLabel: 'Save 10%'
        }
      })

      onBundleCreated?.(newBundle)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to create bundle:', error)
      alert('Failed to create bundle. Please try again.')
    } finally {
      setIsCreatingBundle(false)
    }
  }

  const handleQuickAdd = async (bundle: Bundle) => {
    await handleAddToBundle(bundle)
  }

  return (
    <div className={`item-bundle-controls ${className}`}>
      <Dropdown
        isOpen={isDropdownOpen}
        onToggle={setIsDropdownOpen}
        trigger={
          <Button
            size="sm"
            variant="outline"
            disabled={isCreatingBundle}
          >
            {isCreatingBundle ? 'Creating...' : 'Add to Bundle'}
          </Button>
        }
      >
        <div className="item-bundle-controls__dropdown">
          <div className="item-bundle-controls__header">
            <h4>Add to Bundle</h4>
            <p>Choose an existing bundle or create a new one</p>
          </div>

          {availableBundles.length > 0 && (
            <div className="item-bundle-controls__existing">
              <h5>Existing Bundles</h5>
              <div className="item-bundle-controls__bundles">
                {availableBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="item-bundle-controls__bundle"
                    onClick={() => handleQuickAdd(bundle)}
                  >
                    <div className="item-bundle-controls__bundle-info">
                      <h6>{bundle.name}</h6>
                      <p>{bundle.items?.length || 0} items</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="item-bundle-controls__actions">
            <Button
              size="sm"
              onClick={handleCreateNewBundle}
              disabled={isCreatingBundle}
            >
              {isCreatingBundle ? 'Creating...' : 'Create New Bundle'}
            </Button>
          </div>
        </div>
      </Dropdown>

      {/* Bundle Status Indicator */}
      {bundles.some(bundle => 
        bundle.items?.some(bundleItem => bundleItem.itemId === item.id)
      ) && (
        <Badge variant="success" size="sm">
          In Bundle
        </Badge>
      )}
    </div>
  )
}

// Item Bundle Controls Styles
export const itemBundleControlsStyles = `
.item-bundle-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-bundle-controls__dropdown {
  min-width: 300px;
  padding: 1rem;
}

.item-bundle-controls__header {
  margin-bottom: 1rem;
}

.item-bundle-controls__header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.item-bundle-controls__header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.item-bundle-controls__existing {
  margin-bottom: 1rem;
}

.item-bundle-controls__existing h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.item-bundle-controls__bundles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-bundle-controls__bundle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.item-bundle-controls__bundle:hover {
  background: var(--muted-background);
  border-color: var(--primary-color);
}

.item-bundle-controls__bundle-info h6 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.item-bundle-controls__bundle-info p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.item-bundle-controls__actions {
  display: flex;
  justify-content: center;
}
`
