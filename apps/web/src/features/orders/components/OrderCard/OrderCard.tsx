import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, CardFooter, Badge } from '@shared/ui/primitives'
import { Button } from '@shared/ui/primitives'
import { Radio, Package, Truck, CheckCircle, XCircle, Phone, MapPin } from 'lucide-react'
import type { OrderResponse } from '@api/types'
import type { OrderStatus } from '@api/backend-types'
import { formatCurrency, formatRelativeTime, formatDate } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import { WhatHappensNext } from '../WhatHappensNext'

/**
 * OrderCard - Modern order card with Tailwind + icons
 */

export interface OrderCardProps {
  readonly order: OrderResponse
  readonly onClick?: (orderId: string) => void
  readonly showStoreInfo?: boolean
  readonly storeInfo?: {
    name: string
    phone?: string
    address?: string
    deliveryType: 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'PICKUP' | 'THIRD_PARTY_PROVIDER'
  }
}

const statusConfig: Partial<Record<OrderStatus, {
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary',
  icon: typeof Package,
  label: string
}>> = {
  PENDING_PAYMENT: { variant: 'secondary', icon: Package, label: 'Pending Payment' },
  PLACED: { variant: 'default', icon: Package, label: 'Order Placed' },
  ACCEPTED: { variant: 'default', icon: CheckCircle, label: 'Accepted' },
  PREPARING: { variant: 'warning', icon: Package, label: 'Preparing' },
  READY: { variant: 'warning', icon: Truck, label: 'Ready for Pickup' },
  OUT_FOR_DELIVERY: { variant: 'warning', icon: Truck, label: 'Out for Delivery' },
  DELIVERED: { variant: 'success', icon: CheckCircle, label: 'Delivered' },
  COMPLETED: { variant: 'success', icon: CheckCircle, label: 'Completed' },
  CANCELED: { variant: 'destructive', icon: XCircle, label: 'Canceled' },
}

const deliveryIcons = {
  PICKUP: Package,
  DELIVERY: Truck,
}

export function OrderCard({ order, onClick, showStoreInfo = false, storeInfo }: OrderCardProps) {
  const navigate = useNavigate()
  const total = parsePrice(order.total)
  const tip = parsePrice(order.tip || '0')
  const handleClick = onClick ? () => onClick(order.id) : undefined

  const statusInfo = statusConfig[order.status as OrderStatus]
  const StatusIcon = statusInfo?.icon || Package
  const DeliveryIcon = deliveryIcons[order.deliveryType as keyof typeof deliveryIcons] || Package

  // Delivery mode badge configuration
  const deliveryModeConfig = {
    PICKUP: { icon: Package, label: 'Pickup', color: 'green' },
    STORE_MANAGED_DELIVERY: { icon: Truck, label: 'Store Delivery', color: 'blue' },
    PLATFORM_DRIVER: { icon: Truck, label: 'Platform Driver', color: 'purple' },
    THIRD_PARTY_PROVIDER: { icon: Package, label: 'Third-Party', color: 'orange' }
  }
  
  const deliveryModeBadge = storeInfo?.deliveryType ? 
    deliveryModeConfig[storeInfo.deliveryType] : 
    { icon: Package, label: 'Pickup', color: 'green' }
  const DeliveryModeIcon = deliveryModeBadge.icon

  // Check if order is active
  const isActive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status)

  const handleTrackOrder = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate('/orders/' + order.id + '')
  }

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isActive 
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 border-blue-200' 
          : 'hover:border-blue-300 border-gray-200'
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${
              isActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <StatusIcon className={`w-4 h-4 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <span className="font-medium text-gray-900">{statusInfo?.label}</span>
              <p className="text-xs text-gray-500 mt-0.5">Order #{order.id}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusInfo?.variant} className="text-xs font-medium">
              {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
            </Badge>
            {showStoreInfo && deliveryModeBadge && (
              <Badge variant="outline" className={`text-xs font-medium bg-${deliveryModeBadge.color}-50 text-${deliveryModeBadge.color}-700 border-${deliveryModeBadge.color}-200`}>
                <DeliveryModeIcon className="w-3 h-3 mr-1" /> {deliveryModeBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Store Information */}
        {showStoreInfo && storeInfo && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{storeInfo.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs font-medium bg-${deliveryModeBadge.color}-50 text-${deliveryModeBadge.color}-700 border-${deliveryModeBadge.color}-200`}>
                    <DeliveryModeIcon className="w-3 h-3 mr-1" /> {deliveryModeBadge.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              {storeInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{storeInfo.phone}</span>
                </div>
              )}
              {storeInfo.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{storeInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What Happens Next */}
        {showStoreInfo && storeInfo?.deliveryType && (
          <WhatHappensNext 
            deliveryMode={storeInfo.deliveryType}
            className="mb-4"
          />
        )}

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>

        {/* Tip */}
        {tip > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Includes tip</span>
            <span className="font-medium">{formatCurrency(tip)}</span>
          </div>
        )}

        {/* Delivery Method */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Method</span>
          <div className="flex items-center gap-1">
            <DeliveryIcon className="h-3.5 w-3.5" />
            <span className="font-medium">{order.deliveryType}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Payment</span>
          <Badge 
            variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
            className="text-xs"
          >
            {order.paymentStatus}
          </Badge>
        </div>
      </CardContent>

      {/* Track Button */}
      {isActive && (
        <CardFooter>
          <Button 
            variant="primary" 
            size="small"
            fullWidth
            onClick={handleTrackOrder}
          >
            <Radio className="h-4 w-4 animate-pulse" />
            Track Live
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

