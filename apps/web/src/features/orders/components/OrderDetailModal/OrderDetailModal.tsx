/**
 * OrderDetailModal - Detailed order view with items and status
 * Migrated from Modal to Dialog
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Badge, Spinner } from '@shared/ui/primitives'
import { useOrder } from '@shared/hooks/generated'
import { formatCurrency, formatDateLong } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import type { OrderStatus } from '@api/types'
import { styles } from '@shared/lib/tailwind-classes'

export interface OrderDetailModalProps {
  orderId: string
  onClose: () => void
}

const statusVariants: Record<OrderStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PREPARING: 'warning',
  READY: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Accepted by Restaurant',
  PREPARING: 'Being Prepared',
  READY: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Canceled',
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
      <div className={styles.content}>
        <div className={styles.statusSection}>
          <Badge variant={statusVariants[order.status as OrderStatus]}>
            {statusLabels[order.status as OrderStatus] || order.status}
          </Badge>
          <p className={styles.orderDate}>{formatDateLong(order.createdAt)}</p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Order Details</h3>
          <div className={styles.detailsGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Delivery Method</span>
              <span className={styles.detailValue}>
                {order.deliveryType === 'PICKUP' ? '🏪 Pickup' : '🚗 Delivery'}
              </span>
            </div>
            
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Payment Status</span>
              <Badge 
                variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                className="text-xs"
              >
                {order.paymentStatus}
              </Badge>
            </div>

            {order.addressSnapshot && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Delivery Address</span>
                <span className={styles.detailValue}>
                  {order.addressSnapshot.line1}<br />
                  {order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.postalCode}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Order Summary</h3>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery & Service Fees</span>
              <span>{formatCurrency(fees)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {tip > 0 && (
              <div className={styles.summaryRow}>
                <span>Tip</span>
                <span>{formatCurrency(tip)}</span>
              </div>
            )}
            <div className={styles.divider} />
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} className={styles.closeButton}>
            Close
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}

