/**
 * Bundle List Component
 * Displays a list of bundles with filtering and actions
 */
import React, { useState } from 'react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Badge } from '@components/ui/Badge'
import { BundleCard } from './BundleCard'
import { useBundleManagement } from '../hooks/useBundleManagement'
import type { Bundle } from '../../../api/types'

interface BundleListProps {
  storeId: string
  onEditBundle?: (bundle: Bundle) => void
  onDeleteBundle?: (bundle: Bundle) => void
  onCreateBundle?: () => void
  className?: string
}

export function BundleList({
  storeId,
  onEditBundle,
  onDeleteBundle,
  onCreateBundle,
  className = ''
}: BundleListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const {
    bundles,
    isLoading,
    error,
    deleteBundle,
    toggleBundleStatus,
    activeCount,
    inactiveCount,
    isDeleting,
    filterBundles
  } = useBundleManagement({ storeId })

  // Use optimized filtering from hook
  const filteredBundles = filterBundles(searchTerm, statusFilter)

  const handleDeleteBundle = async (bundle: Bundle) => {
    if (window.confirm(`Are you sure you want to delete "${bundle.name}"?`)) {
      try {
        await deleteBundle(bundle.id)
        onDeleteBundle?.(bundle)
      } catch (error) {
        console.error('Failed to delete bundle:', error)
        alert('Failed to delete bundle. Please try again.')
      }
    }
  }

  const handleToggleStatus = async (bundle: Bundle) => {
    try {
      await toggleBundleStatus(bundle.id, !bundle.isActive)
    } catch (error) {
      console.error('Failed to toggle bundle status:', error)
      alert('Failed to update bundle status. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="bundle-list bundle-list--loading">
        <div className="bundle-list__loading">
          <div className="bundle-list__loading-spinner"></div>
          <p>Loading bundles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bundle-list bundle-list--error">
        <div className="bundle-list__error">
          <p>Failed to load bundles. Please try again.</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bundle-list ${className}`}>
      {/* Header */}
      <div className="bundle-list__header">
        <div className="bundle-list__title">
          <h2>Bundles ({filteredBundles.length})</h2>
          <div className="bundle-list__stats">
            <Badge variant="success" size="sm">
              {activeCount} Active
            </Badge>
            <Badge variant="secondary" size="sm">
              {inactiveCount} Inactive
            </Badge>
          </div>
        </div>
        
        <Button onClick={onCreateBundle}>
          Create Bundle
        </Button>
      </div>

      {/* Filters */}
      <div className="bundle-list__filters">
        <div className="bundle-list__search">
          <Input
            type="text"
            placeholder="Search bundles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bundle-list__status-filter">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Bundle Grid */}
      {filteredBundles.length === 0 ? (
        <div className="bundle-list__empty">
          <div className="bundle-list__empty-content">
            <h3>No bundles found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Create your first bundle to get started.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={onCreateBundle}>
                Create First Bundle
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bundle-list__grid">
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onEdit={onEditBundle}
              onDelete={handleDeleteBundle}
              onToggleStatus={handleToggleStatus}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Bundle List Styles
export const bundleListStyles = `
.bundle-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bundle-list__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.bundle-list__title {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bundle-list__title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bundle-list__stats {
  display: flex;
  gap: 0.5rem;
}

.bundle-list__filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.bundle-list__search {
  flex: 1;
  min-width: 200px;
}

.bundle-list__status-filter {
  display: flex;
  gap: 0.5rem;
}

.bundle-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.bundle-list__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.bundle-list__empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bundle-list__empty-content h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bundle-list__empty-content p {
  margin: 0;
  color: var(--text-secondary);
}

.bundle-list--loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.bundle-list__loading {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bundle-list__loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.bundle-list--error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.bundle-list__error {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
`
