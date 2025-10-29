/**
 * Bundle List Component
 * Displays a list of bundles with filtering and actions
 */
import React, { useState } from 'react'
import { Button, Input, Badge } from '@shared/ui/primitives'
import { BundleCard } from './BundleCard'
import { useBundleManagement } from '../hooks/useBundleManagement'
import type { Bundle } from '../../../api/backend-types'

interface BundleListProps {
  readonly storeId: string
  readonly onEditBundle?: (bundle: Bundle) => void
  readonly onDeleteBundle?: (bundle: Bundle) => void
  readonly onCreateBundle?: () => void
  readonly className?: string
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
    isLoading,
    error,
    deleteBundle,
    toggleBundleStatus,
    activeCount,
    inactiveCount,
    filterBundles
  } = useBundleManagement({ storeId })

  // Use optimized filtering from hook
  const filteredBundles = filterBundles(searchTerm, statusFilter)

  const handleDeleteBundle = (bundle: Bundle) => {
    if (window.confirm(`Are you sure you want to delete "${bundle.name}"?`)) {
      void (async () => {
        try {
          await deleteBundle(bundle.id)
          onDeleteBundle?.(bundle)
        } catch (error) {
          console.error('Failed to delete bundle:', error)
          alert('Failed to delete bundle. Please try again.')
        }
      })()
    }
  }

  const handleToggleStatus = (bundle: Bundle) => {
    void (async () => {
      try {
        await toggleBundleStatus(bundle.id, !bundle.isActive)
      } catch (error) {
        console.error('Failed to toggle bundle status:', error)
        alert('Failed to update bundle status. Please try again.')
      }
    })()
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
          <Badge variant="success">
            {activeCount} Active
          </Badge>
          <Badge variant="secondary">
            {inactiveCount} Inactive
          </Badge>
        </div>
      </div>

      <Button onClick={() => onCreateBundle?.()}>
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
            variant={statusFilter === 'all' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
            size="small"
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
              <Button onClick={() => onCreateBundle?.()}>
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