/**
 * VendorOrderCard - Individual order card for vendor dashboard
 * Extracted from VendorOrdersPage with Tailwind styling
 */
import { Badge, Button } from '@ui'
import { formatPriceCurrency } from '@utils/format'
import { getOrderAge } from '@utils/orderHelpers'
import type { OrderResponse } from '@api/types'

export interface VendorOrderCardProps {
  order: OrderResponse
  onSelect: () => void
  onStatusUpdate: (orderId: string, newStatus: string) => void
  isSelected: boolean
}

export function VendorOrderCard({ order, onSelect, onStatusUpdate, isSelected }: VendorOrderCardProps) {
  const orderAge = getOrderAge(order.createdAt || new Date().toISOString())
  const isUrgent = orderAge.minutes > 15 && ['PLACED', 'ACCEPTED'].includes(order.status)

  return (
    <div
      onClick={onSelect}
      className={
        'bg-white rounded-lg p-4 border-2 cursor-pointer transition-all duration-200 ' +
        (isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-md') +
        (isUrgent ? ' border-l-4 border-l-red-500 bg-red-50' : '')
      }
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            #{order.id.slice(0, 8).toUpperCase()}
          </h3>
          <Badge variant={
            order.status === 'PLACED' ? 'warning' :
            order.status === 'ACCEPTED' ? 'secondary' :
            order.status === 'PREPARING' ? 'default' :
            order.status === 'READY' ? 'success' :
            'default'
          }>
            {order.status}
          </Badge>
        </div>
        <div className="text-right">
          <span className={isUrgent ? 'text-red-600 font-bold text-sm' : 'text-gray-500 text-sm'}>
            {orderAge.display}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <span className="block text-sm font-semibold text-gray-900">
          👤 {order.user?.name || 'Customer'}
        </span>
        {order.user?.phone && (
          <span className="block text-xs text-gray-600 mt-1">
            📞 {order.user.phone}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="mb-3">
        {(() => {
          try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
            return items?.slice(0, 2).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{item.quantity}x</span>
                <span className="flex-1 text-gray-900 mx-2">{item.titleSnapshot}</span>
              </div>
            ))
          } catch {
            return <div className="text-sm text-gray-500">Unable to load items</div>
          }
        })()}
        {(() => {
          try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
            return (items?.length || 0) > 2 && (
              <span className="text-xs text-gray-500">
                +{(items?.length || 0) - 2} more
              </span>
            )
          } catch {
            return null
          }
        })()}
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

      {/* Quick Actions */}
      {isSelected && ['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {order.status === 'PLACED' && (
            <Button
              size="small"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate(order.id, 'ACCEPTED')
              }}
              className="flex-1"
            >
              ✅ Accept
            </Button>
          )}
          {order.status === 'ACCEPTED' && (
            <Button
              size="small"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate(order.id, 'PREPARING')
              }}
              className="flex-1"
            >
              👨‍🍳 Start Preparing
            </Button>
          )}
          {order.status === 'PREPARING' && (
            <Button
              size="small"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate(order.id, 'READY')
              }}
              className="flex-1"
            >
              🎉 Mark Ready
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

