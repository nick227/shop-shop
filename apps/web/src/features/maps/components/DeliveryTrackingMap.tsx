import { MapPin, Navigation, Clock, Truck, Package, RefreshCw } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import type { LatLng } from '@shared/lib/utils/maps'
import {
  formatMilesDistance,
  haversineMiles,
  openNavigateNewTab,
} from '@shared/lib/utils/maps'
import { StoreDestinationMap } from '@features/stores/components/StoreMap/StoreDestinationMap'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'

export interface DeliveryTrackingMapProps {
  readonly storeLocation: Readonly<LatLng>
  readonly deliveryLocation?: Readonly<LatLng>
  readonly userLocation?: Readonly<LatLng>
  readonly driverLocation?: Readonly<LatLng>
  readonly storeName: string
  readonly deliveryMode:
    | 'PICKUP'
    | 'DELIVERY'
    | 'STORE_MANAGED_DELIVERY'
    | 'PLATFORM_DRIVER'
    | 'THIRD_PARTY_PROVIDER'
  readonly estimatedTime?: string
  readonly status:
    | 'PLACED'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'READY'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELED'
    | 'COMPLETED'
  readonly onRefresh?: () => void
}

function isPickupMode(mode: DeliveryTrackingMapProps['deliveryMode']) {
  return mode === 'PICKUP'
}

function statusIcon(status: DeliveryTrackingMapProps['status']) {
  switch (status) {
    case 'PREPARING':
    case 'PLACED':
    case 'ACCEPTED':
      return <Package className="w-5 h-5 text-amber-600" />
    case 'READY':
      return <Clock className="w-5 h-5 text-blue-600" />
    case 'OUT_FOR_DELIVERY':
      return <Truck className="w-5 h-5 text-green-600" />
    case 'COMPLETED':
    case 'DELIVERED':
      return <MapPin className="w-5 h-5 text-muted-foreground" />
    case 'CANCELED':
      return <Package className="w-5 h-5 text-muted-foreground" />
    default:
      return <Package className="w-5 h-5 text-muted-foreground" />
  }
}

function statusLine(
  status: DeliveryTrackingMapProps['status'],
  pickup: boolean,
): string {
  switch (status) {
    case 'PREPARING':
    case 'PLACED':
    case 'ACCEPTED':
      return 'Being prepared'
    case 'READY':
      return pickup ? 'Ready for pickup' : 'Ready for dispatch'
    case 'OUT_FOR_DELIVERY':
      return pickup ? 'Pickup window' : 'Out for delivery'
    case 'COMPLETED':
    case 'DELIVERED':
      return pickup ? 'Picked up' : 'Delivered'
    case 'CANCELED':
      return 'Canceled'
    default:
      return 'Processing'
  }
}

export function DeliveryTrackingMap({
  storeLocation,
  deliveryLocation,
  driverLocation,
  storeName,
  deliveryMode,
  estimatedTime,
  status,
  onRefresh,
}: DeliveryTrackingMapProps) {
  const pickup = isPickupMode(deliveryMode)
  const routeMiles =
    deliveryLocation && !pickup
      ? haversineMiles(storeLocation, deliveryLocation)
      : undefined

  const mapSection =
    !pickup && deliveryLocation ? (
      <StoreDestinationMap
        store={{
          latitude: storeLocation.latitude,
          longitude: storeLocation.longitude,
          label: storeName,
        }}
        destination={{
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude,
          label: 'Drop-off',
        }}
        driver={
          driverLocation && status === 'OUT_FOR_DELIVERY'
            ? {
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                label: 'Courier',
              }
            : undefined
        }
        height="280px"
      />
    ) : (
      <StorePreviewMap
        latitude={storeLocation.latitude}
        longitude={storeLocation.longitude}
        height="220px"
        zoom={14}
      />
    )

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {statusIcon(status)}
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{storeName}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {statusLine(status, pickup)}
              </p>
            </div>
          </div>
          {estimatedTime ? (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="font-medium tabular-nums">{estimatedTime}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative border-b border-border bg-muted/20">
        {mapSection}
        {onRefresh ? (
          <div className="absolute top-3 right-3">
            <Button
              type="button"
              size="small"
              variant="secondary"
              className="shadow-md"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        {!pickup && typeof routeMiles === 'number' && Number.isFinite(routeMiles) ? (
          <p className="text-sm text-muted-foreground">
            Straight-line distance: {formatMilesDistance(routeMiles)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="flex-1 min-w-[140px]"
            onClick={() =>
              openNavigateNewTab({
                destination: pickup ? storeLocation : deliveryLocation ?? storeLocation,
                destinationLabel: storeName,
              })
            }
          >
            <Navigation className="w-4 h-4 mr-2" />
            {pickup ? 'Directions to store' : 'Directions to address'}
          </Button>
          {!pickup ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-w-[140px]"
              onClick={() =>
                openNavigateNewTab({
                  destination: storeLocation,
                  destinationLabel: storeName,
                })
              }
            >
              Store location
            </Button>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {pickup ? 'Pickup' : 'Delivery'}
          </span>
          <span className="text-sm text-muted-foreground">
            {statusLine(status, pickup)}
          </span>
        </div>
      </div>
    </div>
  )
}
