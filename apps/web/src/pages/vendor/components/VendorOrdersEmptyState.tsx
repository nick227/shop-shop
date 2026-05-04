/**
 * VendorOrdersEmptyState - Empty state for vendor orders page
 * 
 * Replaces spinner-only state with proper messaging and CTAs.
 */

import { Button, Spinner } from '@shared/ui/primitives'
import { Package, Clock, Store } from 'lucide-react'

interface VendorOrdersEmptyStateProps {
  readonly isLoading?: boolean
  readonly hasFilter?: boolean
  /** When `hasFilter`, shown in the message (e.g. current status tab name). */
  readonly filterLabel?: string
  readonly onClearFilter?: () => void
}

export function VendorOrdersEmptyState({
  isLoading = false,
  hasFilter = false,
  filterLabel,
  onClearFilter,
}: VendorOrdersEmptyStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <Spinner size="large" />
        <p className="text-muted-foreground">Loading live orders…</p>
      </div>
    )
  }

  if (hasFilter) {
    const label = filterLabel ? ` “${filterLabel}”` : ''
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No orders found{label}</h3>
          <p className="text-muted-foreground max-w-md">
            There are no orders with this status right now. Try another filter or view all orders to
            see everything in your queue.
          </p>
        </div>
        {onClearFilter && (
          <Button variant="outline" onClick={onClearFilter}>
            Clear Filter
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        <Clock className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-lg font-semibold">No orders yet</h3>
        <p className="text-muted-foreground">
          When customers place orders, they'll appear here in real-time. You'll receive notifications for new orders automatically.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>Live updates</span>
          </div>
          <div className="flex items-center gap-1">
            <Store className="w-3 h-3" />
            <span>Real-time processing</span>
          </div>
        </div>
      </div>
      <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="font-medium mb-1">💡 Pro tip:</p>
        <p>Enable Auto-Accept in the header to automatically accept new orders as they come in.</p>
      </div>
    </div>
  )
}
