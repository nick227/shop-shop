import { formatPriceCurrency } from '@shared/lib/format'
import { Clock, MapPin, Package, Phone, User, CheckCircle, Truck } from 'lucide-react'
import type { OrderItem, AddressSnapshot } from '@api/backend-types'
import { Badge } from '@shared/ui/primitives'
import { WhatHappensNext } from './WhatHappensNext'

export interface StoreGroupedReceiptProps {
  orders: Array<{
    id: string
    storeName: string
    storePhone?: string
    storeAddress?: AddressSnapshot
    deliveryType: 'DELIVERY' | 'PICKUP'
    deliveryMode?: string
    items: OrderItem[]
    subtotal: number
    deliveryFee: number
    tax: number
    tip: number
    total: number
    estimatedReadyTime?: string
    estimatedDeliveryTime?: string
    paymentMethod: string
    orderPlacedAt: string
    status: string
  }>
  onTrackOrder?: (orderId: string) => void
  onContactStore?: (storeId: string, storeName: string, storePhone?: string) => void
}

// Helper function for delivery mode badge
function getDeliveryModeBadge(deliveryMode: string) {
  const deliveryModeConfig = {
    PICKUP: { icon: '🏃', label: 'Pickup', color: 'green' },
    STORE_MANAGED_DELIVERY: { icon: '🚗', label: 'Store Delivery', color: 'blue' },
    PLATFORM_DRIVER: { icon: '🛵', label: 'Platform Driver', color: 'purple' },
    THIRD_PARTY_PROVIDER: { icon: '📦', label: 'Third-Party', color: 'orange' }
  }
  
  return deliveryModeConfig[deliveryMode as keyof typeof deliveryModeConfig] || 
    { icon: '🏃', label: 'Pickup', color: 'green' }
}

export function StoreGroupedReceipt({ 
  orders, 
  onTrackOrder,
  onContactStore 
}: StoreGroupedReceiptProps) {
  // Group orders by store
  const ordersByStore = orders.reduce((acc: Record<string, any>, order) => {
    const storeKey = `${order.storeName}-${order.storeAddress?.city || 'Unknown'}`
    if (!acc[storeKey]) {
      acc[storeKey] = {
        storeName: order.storeName,
        storePhone: order.storePhone,
        storeAddress: order.storeAddress,
        orders: [],
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        tip: 0,
        total: 0,
      }
    }
    
    acc[storeKey].orders.push(order)
    acc[storeKey].subtotal += Number(order.subtotal) || 0
    acc[storeKey].deliveryFee += Number(order.deliveryFee) || 0
    acc[storeKey].tax += Number(order.tax) || 0
    acc[storeKey].tip += Number(order.tip) || 0
    acc[storeKey].total += Number(order.total) || 0
    
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
          <p className="text-blue-100 text-sm">
            You have {orders.length} order{orders.length !== 1 ? 's' : ''} from {Object.keys(ordersByStore).length} store{Object.keys(ordersByStore).length !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(ordersByStore).map(([storeKey, storeData]) => (
            <div key={storeKey} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Store Header */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {storeData.orders[0].deliveryMode && (
                        <Badge variant="outline" className={`text-xs font-medium bg-${getDeliveryModeBadge(storeData.orders[0].deliveryMode).color}-50 text-${getDeliveryModeBadge(storeData.orders[0].deliveryMode).color}-700 border-${getDeliveryModeBadge(storeData.orders[0].deliveryMode).color}-200`}>
                          {getDeliveryModeBadge(storeData.orders[0].deliveryMode).icon} {getDeliveryModeBadge(storeData.orders[0].deliveryMode).label}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{storeData.storeName}</h3>
                    <div className="text-sm text-gray-600 space-y-1 mt-2">
                      {storeData.storePhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{storeData.storePhone}</span>
                        </div>
                      )}
                      {storeData.storeAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p>{storeData.storeAddress.line1}</p>
                            <p>{storeData.storeAddress.city}, {storeData.storeAddress.state} {storeData.storeAddress.postalCode}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onContactStore && onContactStore(
                      orders.find(o => o.storeName === storeData.storeName)?.id || '',
                      storeData.storeName,
                      storeData.storePhone
                    )}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Contact Store
                  </button>
                </div>
              </div>

              {/* Store Orders */}
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Orders</h4>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {storeData.orders.length} order{storeData.orders.length !== 1 ? 's' : ''}
                    </span>
                    <p className="text-lg font-bold text-gray-900">{formatPriceCurrency(storeData.total)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {storeData.orders.map((order: any, index: number) => (
                    <div key={order.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">Order #{order.id}</span>
                            <Badge variant="outline" className="text-xs">
                              {order.deliveryType === 'DELIVERY' ? '🚗 Delivery' : '🏃 Pickup'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Placed {new Date(order.orderPlacedAt).toLocaleDateString()}
                            {order.estimatedReadyTime && ` • Ready: ${order.estimatedReadyTime}`}
                            {order.estimatedDeliveryTime && ` • Delivery: ${order.estimatedDeliveryTime}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPriceCurrency(order.total)}</p>
                          <button
                            onClick={() => onTrackOrder && onTrackOrder(order.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* What Happens Next for this store */}
                {storeData.orders[0].deliveryMode && (
                  <WhatHappensNext 
                    deliveryMode={storeData.orders[0].deliveryMode}
                    className="mt-4"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
