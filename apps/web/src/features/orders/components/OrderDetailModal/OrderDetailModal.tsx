/**
 * OrderDetailModal - Detailed order view with items and status
 * Migrated from Modal to Dialog
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Badge, Spinner } from '@shared/ui/primitives'
import { useOrder } from '@shared/hooks/generated'
import { formatCurrency, formatDateLong } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import type { OrderStatus } from '@api/types'

export interface OrderDetailModalProps {
  orderId: string
  onClose: () => void
}

const statusVariants: Partial<Record<OrderStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'>> = {
  PENDING_PAYMENT: 'secondary',
  PLACED: 'default',
  ACCEPTED: 'default',
  PREPARING: 'warning',
  READY: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELED: 'destructive',
}

const statusLabels: Partial<Record<OrderStatus, string>> = {
  PENDING_PAYMENT: 'Pending Payment',
  PLACED: 'Order Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Being Prepared',
  READY: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const { data: order, isLoading, error } = useOrder(orderId)

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <Spinner size="large" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !order) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error Loading Order</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-red-600 mb-4">{error?.message || 'Order not found'}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const total = parsePrice(order.total)
  const subtotal = parsePrice(order.subtotal)
  const fees = parsePrice(order.fees)
  const tax = parsePrice(order.tax)
  const tip = parsePrice(order.tip || '0')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id.slice(0, 8).toUpperCase()}</DialogTitle>
        </DialogHeader>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="">
          <Badge variant={statusVariants[order.status as OrderStatus]}>
            {statusLabels[order.status as OrderStatus] || order.status}
          </Badge>
          <p className="">{formatDateLong(order.createdAt)}</p>
        </div>

        <div className="max-w-7xl mx-auto mb-10">
          <h3 className="text-xl font-bold flex items-center gap-2">Order Details</h3>
          <div className="">
            <div className="">
              <span className="">Delivery Method</span>
              <span className="">
                {order.deliveryType === 'PICKUP' ? '🏪 Pickup' : '🚗 Delivery'}
              </span>
            </div>
            
            <div className="">
              <span className="">Payment Status</span>
              <Badge 
                variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                className="text-xs"
              >
                {order.paymentStatus}
              </Badge>
            </div>

            {order.addressSnapshot && (
              <div className="">
                <span className="">Delivery Address</span>
                <span className="">
                  {order.addressSnapshot.line1}<br />
                  {order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.postalCode}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-10">
          <h3 className="text-xl font-bold flex items-center gap-2">Order Summary</h3>
          <div className="">
            <div className="">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="">
              <span>Delivery & Service Fees</span>
              <span>{formatCurrency(fees)}</span>
            </div>
            <div className="">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {tip > 0 && (
              <div className="">
                <span>Tip</span>
                <span>{formatCurrency(tip)}</span>
              </div>
            )}
            <div className="" />
            <div className={` `}>
              <span className="">Total</span>
              <span className="">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="">
          <Button variant="ghost" onClick={onClose} className="">
            Close
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}

