/**
 * Enhanced Item Card Component
 * Item card with integrated bundle management controls
 */
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ItemBundleControls } from './ItemBundleControls'
import type { ItemResponse } from '../../../api/backend-types'

interface Bundle {
  id: string
  name: string
}

interface EnhancedItemCardProps {
  readonly item: ItemResponse
  readonly storeId: string
  readonly onEdit?: (item: ItemResponse) => void
  readonly onDelete?: (item: ItemResponse) => void
  readonly onBundleCreated?: (bundle: Bundle) => void
  readonly showBundleControls?: boolean
  readonly className?: string
}

export function EnhancedItemCard({
  item,
  storeId,
  onEdit,
  onDelete,
  onBundleCreated,
  showBundleControls = true,
  className = ''
}: EnhancedItemCardProps) {
  const handleEdit = () => onEdit?.(item)
  const handleDelete = () => onDelete?.(item)

  return (
    <Card className={`enhanced-item-card ${className}`}>
      {/* Item Image */}
            <div className="enhanced-item-card__image">
        {'imageUrl' in item && typeof item.imageUrl === 'string' && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="enhanced-item-card__image-img"
          />
        ) : (
          <div className="enhanced-item-card__image-placeholder">
            <span>📦</span>
          </div>
        )}
        
        {/* Item Status Badges */}
        <div className="enhanced-item-card__badges">
          {!item.isActive && (
            <Badge variant="secondary">
              Inactive
            </Badge>
          )}
          {item.isSoldOut && (
            <Badge variant="warning">
              Sold Out
            </Badge>
          )}
        </div>
      </div>

      {/* Item Content */}
      <div className="enhanced-item-card__content">
        <div className="enhanced-item-card__header">
          <h3 className="enhanced-item-card__title">{item.title}</h3>
          <div className="enhanced-item-card__price">
            ${Number(item.price).toFixed(2)}
          </div>
        </div>

        {item.description && (
          <p className="enhanced-item-card__description">
            {item.description}
          </p>
        )}

        <div className="enhanced-item-card__details">
          <div className="enhanced-item-card__detail">
            <span className="enhanced-item-card__detail-label">Stock:</span>
            <span className="enhanced-item-card__detail-value">
              {item.stockQty || 'Unlimited'}
            </span>
          </div>
          
          <div className="enhanced-item-card__detail">
            <span className="enhanced-item-card__detail-label">Sort:</span>
            <span className="enhanced-item-card__detail-value">
              {item.sortIndex}
            </span>
          </div>
        </div>
      </div>

      {/* Item Actions */}
      <div className="enhanced-item-card__actions">
        <div className="enhanced-item-card__primary-actions">
          <Button
            size="small"
            variant="outline"
            onClick={handleEdit}
          >
            Edit
          </Button>
          
          <Button
            size="small"
            variant="danger"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>

        {/* Bundle Controls */}
        {showBundleControls && (
          <div className="enhanced-item-card__bundle-controls">
            <ItemBundleControls
              item={item}
              storeId={storeId}
              onBundleCreated={onBundleCreated}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

// Enhanced Item Card Styles
export const enhancedItemCardStyles = `
.enhanced-item-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--card-background);
  transition: all 0.2s ease;
}

.enhanced-item-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.enhanced-item-card__image {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--muted-background);
}

.enhanced-item-card__image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.enhanced-item-card__image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--text-secondary);
}

.enhanced-item-card__badges {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.enhanced-item-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.enhanced-item-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.enhanced-item-card__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enhanced-item-card__price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
  flex-shrink: 0;
}

.enhanced-item-card__description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.enhanced-item-card__details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.enhanced-item-card__detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.enhanced-item-card__detail-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.enhanced-item-card__detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

.enhanced-item-card__actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.enhanced-item-card__primary-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.enhanced-item-card__bundle-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: var(--muted-background);
  border-radius: 0.375rem;
  border: 1px dashed var(--border-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .enhanced-item-card {
    padding: 1rem;
  }
  
  .enhanced-item-card__image {
    height: 150px;
  }
  
  .enhanced-item-card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .enhanced-item-card__actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .enhanced-item-card__primary-actions {
    justify-content: stretch;
  }
  
  .enhanced-item-card__primary-actions button {
    flex: 1;
  }
}
`
