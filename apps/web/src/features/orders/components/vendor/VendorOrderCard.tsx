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
import type { OrderResponse } from '@api/types'

export interface VendorOrderCardProps {
  order: OrderResponse
  onSelect: () => void
  onStatusUpdate: (orderId: string, newStatus: string) => void
  isSelected: boolean
  isBulkMode?: boolean
  isBulkSelected?: boolean
}

export function VendorOrderCard({ 
  order, 
  onSelect, 
  onStatusUpdate, 
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
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {orderId}
          </h3>
          <OrderStatusBadge status={order.status as Parameters<typeof OrderStatusBadge>[0]['status']} />
        </div>
        <div className="text-right">
          <span className={isUrgent ? 'text-red-600 font-bold text-sm' : 'text-gray-500 text-sm'}>
            {orderAge.display}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <OrderDetails order={order} />

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
