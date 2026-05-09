/**
 * OrderTrackingPage — customer order status + delivery tracking (polling + optional realtime).
 */

import { Button, Card, CardContent, Badge } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'
import { TipPrompt } from '@features/checkout/components/TipPrompt'
import { OrderDetailsCard } from '@features/orders/components/OrderDetailsCard'
import {
  ArrowLeft,
  Truck,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'

import { useOrderTracking } from './hooks/useOrderTracking'
import { OrderStatusCard } from './components/OrderStatusCard'
import { OrderTrackingLoading } from './components/OrderTrackingLoading'
import { OrderTrackingError } from './components/OrderTrackingError'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@stores/authStore'
import { useRealtimeDelivery } from '@/hooks/useRealtimeDelivery'
import { DeliveryTrackingMap } from '@features/maps/components/DeliveryTrackingMap'
import type { DeliveryTrackingMapProps } from '@features/maps/components/DeliveryTrackingMap'
import { coerceValidLatLng, coerceValidLatLngFromGeo } from '@shared/lib/utils/maps'

function providerLabel(provider: string): string {
  switch (provider) {
    case 'DOORDASH_DRIVE':
      return 'DoorDash'
    case 'UBER_DIRECT':
      return 'Uber Direct'
    case 'IN_HOUSE':
      return 'In-house driver'
    default:
      return provider
  }
}

export default function OrderTrackingPage() {
  const {
    order,
    store,
    orderItems,
    orderStatusInfo,
    orderTimeInfo,
    orderProgress,
    deliveryJob,
    deliveryPollIntervalMs,
    isLoadingOrder,
    orderNotFound,
    canShowTipPrompt,
    isTipLoading,
    handleTipSubmit,
    handleTipClose,
    handleBackToOrders,
    refetchDeliveryJob,
  } = useOrderTracking()

  const user = useAuthStore((state) => state.user)
  const orderId = order?.id
  const userId = user?.id

  const { isConnected, lastEvent } = useRealtimeDelivery(orderId, userId)

  usePageTitle(order ? `Order #${order.id?.slice(-6)}` : 'Order Tracking', 'ShopShop')

  const driverLiveLocation =
    lastEvent?.type === 'delivery.location.updated'
      ? coerceValidLatLngFromGeo(lastEvent.payload.location)
      : undefined

  if (isLoadingOrder) {
    return <OrderTrackingLoading />
  }

  if (orderNotFound) {
    return <OrderTrackingError onBackToOrders={handleBackToOrders} />
  }

  if (!order || !orderStatusInfo || !orderTimeInfo || !orderProgress) {
    return <OrderTrackingError onBackToOrders={handleBackToOrders} />
  }

  const paymentStatus = (order as { paymentStatus?: string }).paymentStatus as string | undefined
  const normalizedAddress = order.addressSnapshot
    ? { ...order.addressSnapshot, line2: order.addressSnapshot.line2 ?? undefined }
    : undefined

  const storeRecord = store as { latitude?: unknown; longitude?: unknown; name?: string } | undefined
  const storeCoords = coerceValidLatLng({
    latitude: storeRecord?.latitude,
    longitude: storeRecord?.longitude,
  })
  const dropCoords =
    order.deliveryLatitude !== undefined && order.deliveryLongitude !== undefined
      ? coerceValidLatLng({
          latitude: order.deliveryLatitude,
          longitude: order.deliveryLongitude,
        })
      : undefined

  const mapStatus = order.status as DeliveryTrackingMapProps['status']

  const jobBad =
    deliveryJob &&
    typeof deliveryJob === 'object' &&
    'status' in deliveryJob &&
    ['FAILED', 'CANCELED'].includes(String((deliveryJob as { status: string }).status))

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-3xl"
      contentClassName="space-y-5 py-6 md:py-6"
    >
      <Button
        variant="ghost"
        size="small"
        onClick={handleBackToOrders}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Button>

      <OrderStatusCard
        order={order}
        orderStatusInfo={orderStatusInfo}
        orderTimeInfo={orderTimeInfo}
        orderProgress={orderProgress}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
          />
          <span>
            {isConnected
              ? 'Live updates connected'
              : `Polling every ${Math.round(deliveryPollIntervalMs / 1000)}s`}
          </span>
        </div>
        {lastEvent ? (
          <span className="text-xs tabular-nums">
            Last event: {new Date(lastEvent.timestamp).toLocaleString()}
          </span>
        ) : null}
      </div>

      {storeCoords ? (
        <DeliveryTrackingMap
          storeLocation={storeCoords}
          deliveryLocation={dropCoords ?? undefined}
          driverLocation={driverLiveLocation ?? undefined}
          storeName={store?.name ?? 'Store'}
          deliveryMode={order.deliveryMode as DeliveryTrackingMapProps['deliveryMode']}
          status={mapStatus}
          onRefresh={() => void refetchDeliveryJob()}
        />
      ) : null}

      {deliveryJob && typeof deliveryJob === 'object' ? (
        <Card className="mt-2">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery — {providerLabel(String((deliveryJob as { provider?: string }).provider ?? ''))}
            </h3>

            {jobBad ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">
                    {(deliveryJob as { status: string }).status === 'FAILED'
                      ? 'Delivery attempt failed'
                      : 'Delivery was canceled'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your order status above reflects the latest update. Contact the store if you need help.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Courier / provider</p>
                <p className="font-semibold capitalize">
                  {(deliveryJob as { providerStatus?: string }).providerStatus?.replace(/_/g, ' ') ?? '—'}
                </p>
              </div>
              <Badge
                variant={
                  (deliveryJob as { providerStatus?: string }).providerStatus === 'delivered'
                    ? 'success'
                    : jobBad
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {(deliveryJob as { status?: string }).status?.replace(/_/g, ' ') ?? 'Active'}
              </Badge>
            </div>

            {(deliveryJob as { trackingUrl?: string }).trackingUrl ? (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground mb-2">External tracking</p>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() =>
                    window.open((deliveryJob as { trackingUrl: string }).trackingUrl, '_blank')
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open {providerLabel(String((deliveryJob as { provider?: string }).provider ?? ''))} tracking
                </Button>
              </div>
            ) : null}

            {!jobBad &&
            (deliveryJob as { providerStatus?: string }).providerStatus !== 'delivered' ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Status</p>
                </div>
                <p className="text-base font-semibold">
                  {(deliveryJob as { providerStatus?: string }).providerStatus === 'picked_up'
                    ? 'Out for delivery'
                    : (deliveryJob as { providerStatus?: string }).providerStatus === 'accepted'
                      ? 'Courier assigned'
                      : 'In progress'}
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Need help?</p>
              <Button variant="outline" className="w-full justify-start" type="button">
                <Phone className="w-4 h-4 mr-2" />
                Contact store
              </Button>
              <Button variant="outline" className="w-full justify-start" type="button">
                <Mail className="w-4 h-4 mr-2" />
                Support
              </Button>
            </div>

            {(deliveryJob as { updatedAt?: string }).updatedAt ? (
              <p className="text-center text-xs text-muted-foreground pt-2 border-t">
                Job updated{' '}
                {new Date((deliveryJob as { updatedAt: string }).updatedAt).toLocaleString()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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

      {!orderStatusInfo.isCanceled && !orderStatusInfo.isCompleted ? (
        <div className="text-center">
          <Button variant="ghost" onClick={handleBackToOrders}>
            View All Orders
          </Button>
        </div>
      ) : null}

      {canShowTipPrompt ? (
        <TipPrompt
          isOpen={true}
          onClose={handleTipClose}
          orderId={order.id}
          storeName={store?.name ?? 'Store'}
          onTipSubmit={handleTipSubmit}
          isProcessing={isTipLoading}
        />
      ) : null}
    </PageShell>
  )
}
