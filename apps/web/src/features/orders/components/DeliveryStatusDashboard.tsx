import { useState, useEffect } from 'react'
import { 
  Bell, 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle, 
  Phone, 
  Navigation,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { Badge } from '@shared/ui/primitives'
import { NativeDeliveryStatus } from './NativeDeliveryStatus'
import { DeliveryNotifications, useDeliveryNotifications } from './DeliveryNotifications'
import { CrossDeviceMapSync } from '../../maps/components/CrossDeviceMapSync'
import { DeliveryTrackingMap } from '../../maps/components/DeliveryTrackingMap'

export interface DeliveryOrder {
  id: string
  storeName: string
  storePhone?: string
  storeAddress?: string
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryMode: 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
  currentStatus: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELED'
  estimatedTime?: string
  driverName?: string
  driverPhone?: string
  driverLocation?: { latitude: number; longitude: number }
  orderTotal: number
  orderPlacedAt: string
  storeLocation: { latitude: number; longitude: number }
  deliveryLocation?: { latitude: number; longitude: number }
}

export interface DeliveryStatusDashboardProps {
  orders: DeliveryOrder[]
  userLocation?: { latitude: number; longitude: number }
  onRefreshOrder?: (orderId: string) => void
  onContactDriver?: (orderId: string) => void
  onContactStore?: (orderId: string) => void
  onTrackOrder?: (orderId: string) => void
}

export function DeliveryStatusDashboard({
  orders,
  userLocation,
  onRefreshOrder,
  onContactDriver,
  onContactStore,
  onTrackOrder
}: DeliveryStatusDashboardProps) {
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [showNotifications, setShowNotifications] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { notifications, addNotification, dismissNotification, clearAllNotifications } = useDeliveryNotifications()

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    switch (filter) {
      case 'active':
        return ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.currentStatus)
      case 'completed':
        return ['DELIVERED', 'CANCELED'].includes(order.currentStatus)
      default:
        return true
    }
  })

  // Sort orders by status and time
  const sortedOrders = filteredOrders.sort((a, b) => {
    // Active orders first
    const aActive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(a.currentStatus)
    const bActive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(b.currentStatus)
    
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    
    // Then by time
    return new Date(b.orderPlacedAt).getTime() - new Date(a.orderPlacedAt).getTime()
  })

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    orders.forEach(order => onRefreshOrder?.(order.id))
    setIsRefreshing(false)
    addNotification({
      type: 'info',
      title: 'Orders Refreshed',
      message: 'All order statuses have been updated',
      orderId: 'dashboard',
      storeName: 'System',
      autoClose: true,
      duration: 2000
    })
  }

  const getStatusCounts = () => {
    const counts = {
      active: 0,
      preparing: 0,
      ready: 0,
      delivering: 0,
      completed: 0
    }

    orders.forEach(order => {
      switch (order.currentStatus) {
        case 'PLACED':
        case 'ACCEPTED':
          counts.active++
          break
        case 'PREPARING':
          counts.preparing++
          counts.active++
          break
        case 'READY':
          counts.ready++
          counts.active++
          break
        case 'OUT_FOR_DELIVERY':
          counts.delivering++
          counts.active++
          break
        case 'DELIVERED':
        case 'CANCELED':
          counts.completed++
          break
      }
    })

    return counts
  }

  const counts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Delivery Status</h1>
              <Badge variant="outline" className="text-sm">
                {counts.active} active
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                variant="outline"
                size="small"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                variant="outline"
                size="small"
                className="relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{counts.active}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-orange-900">{counts.preparing}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-purple-900">{counts.ready}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivering</p>
                <p className="text-2xl font-bold text-teal-900">{counts.delivering}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 mb-6">
          <div className="flex space-x-1">
            {[
              { value: 'all', label: 'All Orders', count: orders.length },
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'completed', label: 'Completed', count: counts.completed }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`
                  flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${filter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {sortedOrders.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {filter === 'active' ? 'No active orders' : 
                 filter === 'completed' ? 'No completed orders' : 
                 'No orders found'}
              </p>
            </div>
          ) : (
            sortedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <NativeDeliveryStatus
                  {...order}
                  onRefresh={() => onRefreshOrder?.(order.id)}
                  onContactDriver={() => onContactDriver?.(order.id)}
                  onContactStore={() => onContactStore?.(order.id)}
                  onTrackOrder={() => {
                    setSelectedOrder(order)
                    onTrackOrder?.(order.id)
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Integration */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Track Order</h2>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  variant="ghost"
                  size="small"
                >
                  ×
                </Button>
              </div>
              
              <DeliveryTrackingMap
                storeLocation={selectedOrder.storeLocation}
                deliveryLocation={selectedOrder.deliveryLocation}
                userLocation={userLocation}
                driverLocation={selectedOrder.driverLocation}
                storeName={selectedOrder.storeName}
                deliveryMode={selectedOrder.deliveryMode}
                estimatedTime={selectedOrder.estimatedTime}
                status={selectedOrder.currentStatus}
              />
              
              <CrossDeviceMapSync
                storeLocation={selectedOrder.storeLocation}
                storeName={selectedOrder.storeName}
                deliveryMode={selectedOrder.deliveryType}
                userLocation={userLocation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showNotifications && (
        <DeliveryNotifications
          notifications={notifications}
          onDismiss={dismissNotification}
          onClearAll={clearAllNotifications}
        />
      )}
    </div>
  )
}
