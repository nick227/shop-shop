/**
 * Bundle Card Component
 * Displays bundle information with pricing and actions
 */
import React from 'react'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Badge } from '@components/ui/Badge'
import { BundleSavingsBadge } from './BundleSavingsBadge'
import { BundlePricing } from './BundlePricing'
import type { Bundle } from '../../../api/types'

interface BundleCardProps {
  bundle: Bundle
  onEdit?: (bundle: Bundle) => void
  onDelete?: (bundle: Bundle) => void
  onToggleStatus?: (bundle: Bundle) => void
  showActions?: boolean
  className?: string
}

export function BundleCard({
  bundle,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  className = ''
}: BundleCardProps) {
  const handleEdit = () => onEdit?.(bundle)
  const handleDelete = () => onDelete?.(bundle)
  const handleToggleStatus = () => onToggleStatus?.(bundle)

  return (
    <Card className={`bundle-card ${className}`}>
      <div className="bundle-card__header">
        <div className="bundle-card__image">
          {bundle.imageUrl ? (
            <img 
              src={bundle.imageUrl} 
              alt={bundle.name}
              className="bundle-card__image-img"
            />
          ) : (
            <div className="bundle-card__image-placeholder">
              <span>📦</span>
            </div>
          )}
        </div>
        
        <div className="bundle-card__info">
          <h3 className="bundle-card__name">{bundle.name}</h3>
          {bundle.description && (
            <p className="bundle-card__description">{bundle.description}</p>
          )}
          
          <div className="bundle-card__status">
            <Badge 
              variant={bundle.isActive ? 'success' : 'secondary'}
              size="sm"
            >
              {bundle.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bundle-card__content">
        <BundlePricing bundle={bundle} />
        
        <div className="bundle-card__items">
          <h4 className="bundle-card__items-title">Items ({bundle.totalItems || 0})</h4>
          <div className="bundle-card__items-list">
            {bundle.items?.slice(0, 3).map((bundleItem, index) => (
              <div key={index} className="bundle-card__item">
                <span className="bundle-card__item-name">
                  {bundleItem.item?.title || `Item ${bundleItem.itemId}`}
                </span>
                <span className="bundle-card__item-quantity">
                  x{bundleItem.quantity}
                </span>
              </div>
            ))}
            {bundle.items && bundle.items.length > 3 && (
              <div className="bundle-card__item-more">
                +{bundle.items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="bundle-card__actions">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
          >
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleToggleStatus}
          >
            {bundle.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      )}
    </Card>
  )
}

// Bundle Card Styles (to be added to CSS)
export const bundleCardStyles = `
.bundle-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--card-background);
}

.bundle-card__header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.bundle-card__image {
  width: 4rem;
  height: 4rem;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.bundle-card__image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bundle-card__image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--muted-background);
  font-size: 1.5rem;
}

.bundle-card__info {
  flex: 1;
  min-width: 0;
}

.bundle-card__name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.bundle-card__description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.bundle-card__status {
  display: flex;
  gap: 0.5rem;
}

.bundle-card__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bundle-card__items-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.bundle-card__items-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bundle-card__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  padding: 0.25rem 0;
}

.bundle-card__item-name {
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bundle-card__item-quantity {
  color: var(--text-secondary);
  font-weight: 500;
}

.bundle-card__item-more {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 0.25rem 0;
}

.bundle-card__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
`
