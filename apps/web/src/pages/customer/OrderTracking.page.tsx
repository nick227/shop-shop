/**
 * OrderTrackingPage - Real-time order status tracking for customers
 * Shows live updates as vendor prepares the order
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ordersApi } from '../../api/orders'
import { useCustomerRealtimeOrder } from '../../hooks/useCustomerRealtimeOrder'
import { useTip } from '../../hooks/useTip'
import { useStore } from '../../hooks/generated'
import { Button, Spinner, Badge } from '../../components/ui'
import { TipPrompt } from '../../features/checkout/components/TipPrompt'
import { OrderProgressTracker } from '../../features/orders/components/OrderProgressTracker'
import { OrderDetailsCard } from '../../features/orders/components/OrderDetailsCard'
import { 
  getOrderAge, 
  getEstimatedReadyTime
} from '../../utils/orderHelpers'
import type { OrderStatus, DeliveryType } from '../../api/backend-types'
import { mapOrder } from '../../api/backend-types'

// Helper function to determine badge variant
function getBadgeVariant(status: OrderStatus, isCanceled: boolean, isCompleted: boolean) {
  if (isCanceled) return 'destructive'
  if (isCompleted) return 'success'
  if (status === 'READY') return 'success'
  if (status === 'PREPARING') return 'default'
  return 'warning'
}

// Helper function to parse order items from the orderItems string field
function parseOrderItems(orderItemsString: string | null | undefined) {
  if (!orderItemsString) return []
  
  try {
    const parsed: unknown = JSON.parse(orderItemsString)
    // Convert to the format expected by OrderDetailsCard
    return Array.isArray(parsed) ? parsed.map((item: unknown, index: number) => {
      const orderItem = item as Record<string, unknown>
      return {
        id: (orderItem.id as string) ?? `item-${index}`,
        orderId: (orderItem.orderId as string) ?? '',
        itemId: (orderItem.itemId as string) ?? (orderItem.id as string) ?? `item-${index}`,
        quantity: (orderItem.quantity as number) ?? 1,
        titleSnapshot: (orderItem.titleSnapshot as string) ?? (orderItem.title as string) ?? 'Unknown Item',
        unitPrice: (orderItem.unitPrice as number) ?? (orderItem.price as number) ?? 0,
      }
    }) : []
  } catch (error) {
    console.warn('Failed to parse order items:', error)
    return []
  }
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [showTipPrompt, setShowTipPrompt] = useState(false)
  const [hasShownTipPrompt, setHasShownTipPrompt] = useState(false)
  const { createTip, isLoading: isTipLoading } = useTip()

  // Fetch order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      return ordersApi.getOrder(orderId!)
    },
    enabled: !!orderId,
    refetchInterval: 5000, // Fallback polling (real-time is primary)
  })

  // Convert SDK order data to app types
  const order = orderData ? {
    ...mapOrder(orderData),
    status: orderData.status as OrderStatus,
    deliveryType: orderData.deliveryType as DeliveryType,
    subtotal: Number.parseFloat(orderData.subtotal),
    fees: Number.parseFloat(orderData.fees),
    tax: Number.parseFloat(orderData.tax),
    tip: Number.parseFloat(orderData.tip),
    total: Number.parseFloat(orderData.total),
    addressSnapshot: orderData.addressSnapshot ? {
      line1: orderData.addressSnapshot.line1 as string,
      line2: orderData.addressSnapshot.line2 as string | null,
      city: orderData.addressSnapshot.city as string,
      state: orderData.addressSnapshot.state as string,
      postalCode: orderData.addressSnapshot.postalCode as string,
      country: orderData.addressSnapshot.country as string,
    } : undefined,
  } : undefined

  // Fetch store information
  const storeQuery = useStore(order?.storeId ?? '')
  const store = storeQuery.data as { name?: string } | undefined

  // Parse order items
  const orderItems = orderData ? parseOrderItems((orderData as unknown as Record<string, unknown>).orderItems as string) : []

  // Subscribe to real-time updates
  useCustomerRealtimeOrder({
    orderId: orderId ?? '',
    enableToast: true,
  })

  // Show tip prompt when order is completed
  useEffect(() => {
    if (order?.status === 'COMPLETED' && !hasShownTipPrompt) {
      // Check if there's already a tip for this order
      const hasExistingTip = order.tip > 0
      if (!hasExistingTip) {
        setShowTipPrompt(true)
        setHasShownTipPrompt(true)
      }
    }
  }, [order?.status, order?.tip, hasShownTipPrompt])

  const handleTipSubmit = async (amount: number) => {
    try {
      if (!orderId) return
      
      // Create tip
      const tip = await createTip({
        orderId,
        amount,
      })
      
      // Process tip payment (this would need payment method selection in real implementation)
      // For now, we'll just show success
      console.log('Tip created:', tip)
      
      setShowTipPrompt(false)
      // Show success message
      alert('Tip of $' + amount.toFixed(2) + ' added successfully!')
    } catch (error) {
      console.error('Failed to add tip:', error)
      alert('Failed to add tip. Please try again.')
    }
  }

  const handleTipClose = () => {
    setShowTipPrompt(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Spinner size="large" />
        <p className="text-gray-600">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>
    )
  }

  const orderAge = getOrderAge(order.createdAt)
  const estimatedReadyDate = getEstimatedReadyTime(order.createdAt, 20) // Default prep time
  const estimatedReady = {
    display: estimatedReadyDate.toLocaleTimeString(),
    isLate: estimatedReadyDate < new Date()
  }
  const orderProgressPercentage = 50 // Simple progress percentage
  const statusMessage = `Order ${order.status.toLowerCase()}` // Simple status message

  const isCanceled = order.status === 'CANCELED'
  const isCompleted = order.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </Button>
      </div>

      {/* Order Status Card */}
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <Badge 
            variant={getBadgeVariant(order.status, isCanceled, isCompleted)}
            className="text-lg px-3 py-1"
          >
            {order.status}
          </Badge>
        </div>

        <div className="flex gap-4 text-sm text-gray-600 mb-6 flex-wrap">
          <span>⏱️ Placed {orderAge.display}</span>
          {!isCanceled && !isCompleted && (
            <span className="font-semibold text-blue-600">🎯 {estimatedReady.display}</span>
          )}
        </div>

        {/* Progress Tracker */}
        <OrderProgressTracker currentStatus={order.status} isCanceled={isCanceled} />

        {/* Live Status Message with Progress Bar */}
        {!isCanceled && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">🔴 Live</span>
              {estimatedReady.isLate && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">⚠️ Running late</span>
              )}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full" 
                style={{ width: `${orderProgressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-700 font-medium">{statusMessage}</p>
          </div>
        )}
      </div>

      {/* Order Details */}
      <OrderDetailsCard
        storeName={store?.name ?? 'Loading...'}
        deliveryType={order.deliveryType}
        items={orderItems}
        subtotal={order.subtotal}
        fees={order.fees}
        tax={order.tax}
        tip={order.tip}
        total={order.total}
        paymentMethod={order.paymentStatus === 'PAID' ? '💳 Paid' : '⏳ Pending'}
        address={order.addressSnapshot}
      />

      {/* Actions */}
      {!isCanceled && !isCompleted && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            View All Orders
          </Button>
        </div>
      )}

      {/* Tip Prompt Modal */}
      {order && (
        <TipPrompt
          isOpen={showTipPrompt}
          onClose={handleTipClose}
          orderId={order.id}
          storeName={store?.name ?? 'Store'}
          onTipSubmit={handleTipSubmit}
          isProcessing={isTipLoading}
        />
      )}
    </div>
  )
}

