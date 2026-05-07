/**
 * OrderTrackingPage - Refactored Real-time order status tracking for customers
 *
 * Refactored to use extracted utilities, hooks, and components.
 * Reduced complexity by separating concerns and improving maintainability.
 */

import React from 'react'
import { Button } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'
import { TipPrompt } from '@features/checkout/components/TipPrompt'
import { OrderDetailsCard } from '@features/orders/components/OrderDetailsCard'
import { ArrowLeft } from 'lucide-react'

// Extracted components and hooks
import { useOrderTracking } from './hooks/useOrderTracking'
import { OrderStatusCard } from './components/OrderStatusCard'
import { OrderTrackingLoading } from './components/OrderTrackingLoading'
import { OrderTrackingError } from './components/OrderTrackingError'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function OrderTrackingPage() {
  const {
    order,
    store,
    orderItems,
    orderStatusInfo,
    orderTimeInfo,
    orderProgress,
    isLoadingOrder,
    orderNotFound,
    canShowTipPrompt,
    isTipLoading,
    handleTipSubmit,
    handleTipClose,
    handleBackToOrders,
    navigate,
  } = useOrderTracking()

  usePageTitle(order ? `Order #${order.id?.slice(-6)}` : 'Order Tracking', 'ShopShop')

  // ========================================
  // Loading State
  // ========================================

  if (isLoadingOrder) {
    return <OrderTrackingLoading />
  }

  // ========================================
  // Error State
  // ========================================

  if (orderNotFound) {
    return <OrderTrackingError onBackToOrders={handleBackToOrders} />
  }

  // ========================================
  // Guard Clause
  // ========================================

  if (!order || !orderStatusInfo || !orderTimeInfo || !orderProgress) {
    return <OrderTrackingError onBackToOrders={handleBackToOrders} />
  }

  // ========================================
  // Main Content
  // ========================================
  const paymentStatus = (order as any)?.paymentStatus as string | undefined
  const normalizedAddress = order.addressSnapshot
    ? { ...order.addressSnapshot, line2: order.addressSnapshot.line2 ?? undefined }
    : undefined

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-3xl"
      contentClassName="space-y-5 py-6 md:py-6"
    >
      {/* Back Navigation */}
      <Button
        variant="ghost"
        size="small"
        onClick={handleBackToOrders}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Button>

      {/* Order Status Card */}
      <OrderStatusCard
        order={order}
        orderStatusInfo={orderStatusInfo}
        orderTimeInfo={orderTimeInfo}
        orderProgress={orderProgress}
      />

      {/* Order Details */}
      <OrderDetailsCard
        storeName={store?.name ?? 'Loading...'}
        deliveryType={(order.deliveryType as 'PICKUP' | 'DELIVERY') ?? 'PICKUP'}
        items={orderItems}
        subtotal={order.subtotal}
        fees={order.fees}
        tax={order.tax}
        tip={order.tip}
        total={order.total}
        paymentMethod={paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
        address={normalizedAddress}
      />

      {/* Actions */}
      {!orderStatusInfo.isCanceled && !orderStatusInfo.isCompleted && (
        <div className="text-center">
          <Button variant="ghost" onClick={handleBackToOrders}>
            View All Orders
          </Button>
        </div>
      )}

      {/* Tip Prompt Modal */}
      {canShowTipPrompt && (
        <TipPrompt
          isOpen={true}
          onClose={handleTipClose}
          orderId={order.id}
          storeName={store?.name ?? 'Store'}
          onTipSubmit={handleTipSubmit}
          isProcessing={isTipLoading}
        />
      )}
    </PageShell>
  )
}
