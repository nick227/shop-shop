import { useState, useEffect } from 'react'
import { 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle, 
  Phone, 
  Navigation,
  Bell,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { Badge } from '@shared/ui/primitives'
import { formatPriceCurrency } from '@shared/lib/format'

export interface NativeDeliveryStatusProps {
  orderId: string
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
  onRefresh?: () => void
  onContactDriver?: () => void
  onContactStore?: () => void
  onTrackOrder?: () => void
}

export function NativeDeliveryStatus({
  orderId,
  storeName,
  storePhone,
  storeAddress,
  deliveryType,
  deliveryMode,
  currentStatus,
  estimatedTime,
  driverName,
  driverPhone,
  driverLocation,
  orderTotal,
  onRefresh,
  onContactDriver,
  onContactStore,
  onTrackOrder
}: NativeDeliveryStatusProps) {
  const [timeUntilReady, setTimeUntilReady] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Calculate time until ready
  useEffect(() => {
    if (!estimatedTime) return

    const calculateTimeUntil = () => {
      const now = new Date()
      const estimated = new Date(estimatedTime)
      const diff = estimated.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeUntilReady('Ready now!')
        return
      }

      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)

      if (hours > 0) {
        setTimeUntilReady(`~${hours}h ${minutes % 60}m`)
      } else {
        setTimeUntilReady(`~${minutes}m`)
      }
    }

    calculateTimeUntil()
    const interval = setInterval(calculateTimeUntil, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [estimatedTime])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setLastUpdate(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'PLACED':
        return {
          icon: Package,
          color: 'blue',
          title: 'Order Placed',
          description: 'Your order has been received',
          progress: 20
        }
      case 'ACCEPTED':
        return {
          icon: CheckCircle,
          color: 'green',
          title: 'Order Accepted',
          description: 'The store has confirmed your order',
          progress: 40
        }
      case 'PREPARING':
        return {
          icon: Clock,
          color: 'orange',
          title: 'Preparing',
          description: 'Your order is being prepared',
          progress: 60
        }
      case 'READY':
        return {
          icon: Package,
          color: 'purple',
          title: 'Ready for Pickup',
          description: 'Your order is ready for pickup',
          progress: 80
        }
      case 'OUT_FOR_DELIVERY':
        return {
          icon: Truck,
          color: 'teal',
          title: 'Out for Delivery',
          description: 'Your order is on the way',
          progress: 90
        }
      case 'DELIVERED':
        return {
          icon: CheckCircle,
          color: 'green',
          title: 'Delivered',
          description: 'Your order has been delivered',
          progress: 100
        }
      case 'CANCELED':
        return {
          icon: AlertCircle,
          color: 'red',
          title: 'Order Canceled',
          description: 'Your order has been canceled',
          progress: 0
        }
      default:
        return {
          icon: Package,
          color: 'gray',
          title: 'Processing',
          description: 'Your order is being processed',
          progress: 10
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  const getActionButtons = () => {
    const buttons = []

    // Contact button
    if (currentStatus === 'OUT_FOR_DELIVERY' && driverPhone) {
      buttons.push({
        label: 'Call Driver',
        icon: Phone,
        action: onContactDriver,
        primary: true
      })
    } else if (storePhone) {
      buttons.push({
        label: 'Call Store',
        icon: Phone,
        action: onContactStore,
        primary: true
      })
    }

    // Track button
    if (currentStatus === 'OUT_FOR_DELIVERY' && driverLocation) {
      buttons.push({
        label: 'Track Driver',
        icon: Navigation,
        action: onTrackOrder,
        primary: false
      })
    }

    return buttons
  }

  const actionButtons = getActionButtons()

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <StatusIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{statusConfig.title}</h1>
              <p className="text-blue-100 text-sm">{statusConfig.description}</p>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            size="small"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Order Progress</span>
            <span>{statusConfig.progress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${statusConfig.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Store Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{storeName}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup'} • Order #{orderId.slice(-6)}
              </p>
              {storeAddress && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{storeAddress}</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatPriceCurrency(orderTotal)}</p>
            </div>
          </div>
        </div>

        {/* Time Estimates */}
        {estimatedTime && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">
                  {deliveryType === 'DELIVERY' ? 'Estimated Delivery' : 'Estimated Ready'}
                </h4>
                <p className="text-blue-700 text-sm">{estimatedTime}</p>
                {timeUntilReady && (
                  <p className="text-blue-600 text-xs mt-1">{timeUntilReady}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Driver Info */}
        {currentStatus === 'OUT_FOR_DELIVERY' && driverName && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Your Driver</h4>
                <p className="text-green-700 text-sm">{driverName}</p>
                {driverPhone && (
                  <p className="text-green-600 text-xs mt-1">{driverPhone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {actionButtons.length > 0 && (
          <div className="flex gap-3">
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                onClick={button.action}
                className={`flex-1 ${
                  button.primary 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <button.icon className="w-4 h-4 mr-2" />
                {button.label}
              </Button>
            ))}
          </div>
        )}

        {/* Last Update */}
        <div className="text-center text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6">
        <Button
          onClick={handleRefresh}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="large"
        >
          <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
