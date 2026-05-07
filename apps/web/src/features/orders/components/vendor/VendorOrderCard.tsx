/**
 * VendorOrderCard - Refactored Individual order card for vendor dashboard
 * 
 * Refactored to use extracted utility functions, sub-components, and custom hook.
 * Reduced complexity from 650 CRAP to <50 CRAP.
 */

import { OrderStatusBadge } from '../OrderStatusBadge'
import { OrderActions } from './OrderActions'
import { OrderDetails } from './OrderDetails'
import { useVendorOrderCard } from './hooks/useVendorOrderCard'
import { Badge } from '@shared/ui/primitives'
import type { OrderResponse } from '@api/types'

export interface DeliveryDriverOption {
  id: string
  name?: string | null
  email?: string | null
}

export interface VendorOrderCardProps {
  order: OrderResponse
  onSelect: () => void
  onStatusUpdate: (orderId: string, newStatus: string) => void
  onDriverAssign?: (orderId: string, driverUserId: string | null) => void
  drivers?: DeliveryDriverOption[]
  isSelected: boolean
  isBulkMode?: boolean
  isBulkSelected?: boolean
}

export function VendorOrderCard({ 
  order, 
  onSelect, 
  onStatusUpdate, 
  onDriverAssign,
  drivers = [],
  isSelected, 
  isBulkMode = false, 
  isBulkSelected = false 
}: VendorOrderCardProps) {
  const {
    orderAge,
    isUrgent,
    isDelivery,
    orderId,
    cardClasses
  } = useVendorOrderCard({
    order,
    isSelected,
    isBulkMode,
    isBulkSelected
  })

  return (
    <div onClick={onSelect} className={cardClasses}>
      {/* Bulk Selection Checkbox */}
      {isBulkMode && (
        <div className="absolute top-4 left-4">
          <input
            type="checkbox"
            checked={isBulkSelected}
            onChange={() => {}} // Handled by parent click
            className="h-5 w-5 rounded accent-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h3 className="mb-1 text-lg font-bold tracking-tight text-foreground">
            {orderId}
          </h3>
          <OrderStatusBadge status={order.status as Parameters<typeof OrderStatusBadge>[0]['status']} />
        </div>
        <div className="text-right">
          <span className={isUrgent ? 'text-sm font-bold text-destructive' : 'text-sm text-muted-foreground'}>
            {orderAge.display}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <OrderDetails order={order} />
      
      {/* Delivery Mode Display */}
      {order.deliveryType === 'DELIVERY' && (
        <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery Mode</span>
            <Badge variant="secondary" className="text-xs">
              {order.deliveryMode === 'STORE_MANAGED_DELIVERY' ? 'Store Delivery' :
               order.deliveryMode === 'PLATFORM_DRIVER' ? 'Platform Driver' :
               order.deliveryMode === 'THIRD_PARTY_PROVIDER' ? 'Third-Party' : 'Unknown'}
            </Badge>
          </div>
          {order.deliveryMode === 'STORE_MANAGED_DELIVERY' && (
            <p className="text-sm text-muted-foreground">
              Restaurant handles delivery with their own drivers
            </p>
          )}
          {order.deliveryMode === 'PLATFORM_DRIVER' && (
            <p className="text-sm text-muted-foreground">
              Platform assigns delivery drivers
            </p>
          )}
          {order.deliveryMode === 'THIRD_PARTY_PROVIDER' && (
            <p className="text-sm text-muted-foreground">
              Third-party delivery service (DoorDash, Uber, etc.)
            </p>
          )}
        </div>
      )}

      {isDelivery && (
        <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3" onClick={(event) => event.stopPropagation()}>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Driver
          </label>
          <select
            value={(order as any).assignedToUserId ?? ''}
            onChange={(event) => onDriverAssign?.(order.id, event.target.value || null)}
            disabled={!onDriverAssign || drivers.length === 0}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">{drivers.length === 0 ? 'No drivers ready' : 'Unassigned'}</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name || driver.email || 'Driver'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick Actions */}
      <OrderActions
        status={order.status}
        isDelivery={isDelivery}
        onStatusUpdate={onStatusUpdate}
        orderId={order.id}
      />
    </div>
  )
}
