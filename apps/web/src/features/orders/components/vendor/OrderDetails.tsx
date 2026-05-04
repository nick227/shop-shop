/**
 * Order Details Component
 * 
 * Extracted order details display with items and customer info.
 */

import { Badge } from '@shared/ui/primitives'
import { formatPriceCurrency } from '@shared/lib/format'
import { parseOrderItems, getOrderItemsDisplay } from '../../utils/orderUtils'
import type { OrderResponse } from '@api/types'

interface OrderDetailsProps {
  order: OrderResponse
  className?: string
}

export function OrderDetails({ order, className }: OrderDetailsProps) {
  const items = parseOrderItems(order.items)
  const { displayItems, remainingCount, hasMore } = getOrderItemsDisplay(items)
  
  return (
    <div className={className}>
      {/* Customer Info */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <span className="block text-sm font-semibold text-gray-900">
          👤 {(order.user as any)?.name || 'Customer'}
        </span>
        {(order.user as any)?.phone && (
          <span className="block text-xs text-gray-600 mt-1">
            📞 {(order.user as any).phone}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="mb-3">
        {displayItems.map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">{item.quantity}x</span>
            <span className="flex-1 text-gray-900 mx-2">{item.titleSnapshot}</span>
          </div>
        ))}
        {hasMore && (
          <span className="text-xs text-gray-500">
            +{remainingCount} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-left">
          <span className="block text-xs text-gray-500 uppercase tracking-wide">Total</span>
          <span className="block text-xl font-bold text-gray-900">
            {formatPriceCurrency(order.total)}
          </span>
        </div>
        <Badge variant="outline">
          {order.deliveryType === 'DELIVERY' ? '🚗 Delivery' : '🏃 Pickup'}
        </Badge>
      </div>
    </div>
  )
}
