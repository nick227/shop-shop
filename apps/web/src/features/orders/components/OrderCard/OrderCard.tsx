import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, CardFooter, Badge } from '@shared/ui/primitives'
import { Button } from '@shared/ui/primitives'
import { Radio, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import type { OrderResponse } from '@api/types'
import type { OrderStatus } from '@api/safe-types'
import { formatCurrency, formatRelativeTime, formatDate } from '@shared/lib/format'
import { parsePrice } from '@api/types'

/**
 * OrderCard - Modern order card with Tailwind + icons
 */

export interface OrderCardProps {
  readonly order: OrderResponse
  readonly onClick?: (orderId: string) => void
}

const statusConfig: Record<OrderStatus, { 
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary',
  icon: typeof Package,
  label: string
}> = {
  PENDING: { variant: 'secondary', icon: Package, label: 'Order Placed' },
  CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Accepted' },
  PREPARING: { variant: 'warning', icon: Package, label: 'Preparing' },
  READY: { variant: 'warning', icon: Truck, label: 'Ready for Pickup' },
  COMPLETED: { variant: 'success', icon: CheckCircle, label: 'Completed' },
  CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Canceled' },
}

const deliveryIcons = {
  PICKUP: Package,
  DELIVERY: Truck,
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const navigate = useNavigate()
  const total = parsePrice(order.total)
  const tip = parsePrice(order.tip || '0')
  const handleClick = onClick ? () => onClick(order.id) : undefined

  const statusInfo = statusConfig[order.status as OrderStatus]
  const StatusIcon = statusInfo?.icon || Package
  const DeliveryIcon = deliveryIcons[order.deliveryType as keyof typeof deliveryIcons] || Package

  // Check if order is active
  const isActive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status)

  const handleTrackOrder = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate('/orders/' + order.id + '')
  }

  return (
    <Card 
      onClick={handleClick}
      className="tap-scale hover:shadow-md transition-all cursor-pointer"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {order.createdAt ? formatRelativeTime(order.createdAt) : 'Unknown time'} • {order.createdAt ? formatDate(order.createdAt) : 'Unknown date'}
            </p>
          </div>
          <Badge variant={statusInfo?.variant}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo?.label || order.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
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

