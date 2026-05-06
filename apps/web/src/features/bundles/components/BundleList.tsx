/**
 * Bundle List Component
 * Displays a list of bundles with filtering and actions
 */
import { useState } from 'react'
import { Button, Input, Badge, Spinner } from '@shared/ui/primitives'
import { SectionHeader } from '@shared/ui/layout/PageLayout'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { BundleCard } from './BundleCard'
import { useBundleManagement } from '../hooks/useBundleManagement'
import { Package, Search, Filter } from 'lucide-react'
import type { Bundle } from '@api/types'
import { useHaptics } from '@shared/hooks/useHaptics'

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
  const haptics = useHaptics()

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
      haptics.heavy()
      void (async () => {
        try {
          await deleteBundle(bundle.id)
          onDeleteBundle?.(bundle)
        } catch (error) {
          console.error('Failed to delete bundle:', error)
        }
      })()
    }
  }

  const handleToggleStatus = (bundle: Bundle) => {
    haptics.light()
    void (async () => {
      try {
        await toggleBundleStatus(bundle.id, !bundle.isActive)
      } catch (error) {
        console.error('Failed to toggle bundle status:', error)
      }
    })()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4">
        <Spinner size="medium" />
        <p className="text-sm text-muted-foreground">Loading bundles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/5 rounded-xl border border-destructive/20">
        <p className="text-destructive font-medium mb-3">Failed to load bundles</p>
        <Button variant="outline" size="small" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <SectionHeader 
          title={`All Bundles (${filteredBundles.length})`}
          action={
            <div className="flex gap-2">
              <Badge variant="success" className="bg-success/10 text-success border-success/20">
                {activeCount} Active
              </Badge>
              <Badge variant="secondary">
                {inactiveCount} Inactive
              </Badge>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bundles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex self-start gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:self-auto">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'ghost'}
                size="small"
                onClick={() => { haptics.light(); setStatusFilter(status); }}
                className="capitalize text-xs h-8"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Bundle Grid */}
      {filteredBundles.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchTerm || statusFilter !== 'all' ? "No bundles match your search" : "No bundles found"}
          description={searchTerm || statusFilter !== 'all' ? "Try adjusting your filters or search query." : "Create your first bundle to start selling more!"}
          action={
            !searchTerm && statusFilter === 'all' && (
              <Button variant="primary" onClick={() => onCreateBundle?.()}>
                Create Your First Bundle
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
