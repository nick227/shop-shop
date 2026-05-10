// @ts-nocheck
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Badge, Card, CardContent } from '@shared/ui/primitives'
import { useDoorDashDispatch, useCanDispatchDoorDash } from '../hooks/useDoorDashDispatch'
import { ExternalLink, RefreshCw, X, Truck, Clock, MapPin } from 'lucide-react'
import type { OrderResponse } from '@api/types'

interface DoorDashDispatchPanelProps {
  order: OrderResponse
  onStatusUpdate?: (orderId: string, newStatus: string) => void
  className?: string
}

export function DoorDashDispatchPanel({ order, onStatusUpdate, className }: DoorDashDispatchPanelProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { dispatchDoorDash, cancelDoorDash, getDeliveryJobStatus, isDispatching, dispatchError } = useDoorDashDispatch()
  const { data: canDispatch, isLoading: checkingEligibility } = useCanDispatchDoorDash(order)

  // Check if order already has a delivery job
  const deliveryJobQuery = useQuery({
    queryKey: ['delivery-job', order.id],
    queryFn: async () => {
      const response = await fetch(`/api/delivery/jobs/order/${order.id}`)
      if (!response.ok) return null
      const data = await response.json()
      return data.deliveryJob || null
    },
    enabled: !!order.id
  })

  const deliveryJob = deliveryJobQuery.data

  const handleDispatch = async () => {
    if (!order.deliveryLatitude || !order.deliveryLongitude) {
      return
    }

    dispatchDoorDash({
      orderId: order.id,
      storeId: order.storeId,
      dropoffLatitude: Number(order.deliveryLatitude),
      dropoffLongitude: Number(order.deliveryLongitude)
    })
  }

  const handleCancel = () => {
    if (deliveryJob?.id) {
      cancelDoorDash(deliveryJob.id)
    }
  }

  const handleRefresh = () => {
    deliveryJobQuery.refetch()
  }

  const handleOpenTracking = () => {
    if (deliveryJob?.trackingUrl) {
      window.open(deliveryJob.trackingUrl, '_blank')
    }
  }

  // Don't show panel if order is not third-party delivery
  if (order.deliveryMode !== 'THIRD_PARTY_PROVIDER') {
    return null
  }

  // Show dispatch button for READY orders without delivery job
  if (order.status === 'READY' && !deliveryJob) {
    if (checkingEligibility) {
      return (
        <Card className={`bg-muted/30 border-dashed ${className}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Checking dispatch eligibility...</span>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!canDispatch?.canDispatch) {
      return (
        <Card className={`bg-muted/30 border-dashed ${className}`}>
          <CardContent className="p-4">
            <div className="text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                DoorDash dispatch unavailable
              </p>
              <p className="text-xs text-muted-foreground">
                {canDispatch?.reason || 'Order not ready for dispatch'}
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={`bg-blue-50 border-blue-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">DoorDash Ready</span>
              <Badge variant="success" className="text-xs">
                {canDispatch.quote?.etaMinutes ? `${canDispatch.quote.etaMinutes} min ETA` : 'Ready to dispatch'}
              </Badge>
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleDispatch}
              disabled={isDispatching}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Request DoorDash Driver
                </>
              )}
            </Button>
          </div>
          
          {canDispatch.quote && (
            <div className="text-xs text-blue-700 bg-blue-100 rounded p-2">
              <div className="flex justify-between mb-1">
                <span>Delivery Fee:</span>
                <span className="font-semibold">${(canDispatch.quote.feeCents / 100).toFixed(2)}</span>
              </div>
              {canDispatch.quote.etaMinutes && (
                <div className="flex justify-between">
                  <span>Estimated Time:</span>
                  <span className="font-semibold">{canDispatch.quote.etaMinutes} minutes</span>
                </div>
              )}
            </div>
          )}

          {dispatchError && (
            <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
              Error: {dispatchError.message}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show delivery job status for dispatched orders
  if (deliveryJob) {
    return (
      <Card className={`bg-green-50 border-green-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">DoorDash Driver</span>
              <Badge variant={deliveryJob.providerStatus === 'delivered' ? 'success' : 'secondary'} className="text-xs">
                {deliveryJob.providerStatus || 'Dispatched'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={handleRefresh}
                className="text-green-600 hover:text-green-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {deliveryJob.trackingUrl && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleOpenTracking}
                  className="text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              {deliveryJob.providerStatus !== 'delivered' && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <MapPin className="w-3 h-3" />
              <span>External ID: {deliveryJob.providerExternalId}</span>
            </div>
            
            {deliveryJob.trackingUrl && (
              <div className="flex items-center gap-2 text-xs text-green-700">
                <ExternalLink className="w-3 h-3" />
                <button
                  onClick={handleOpenTracking}
                  className="underline hover:no-underline"
                >
                  Track Delivery
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-green-700">
              <Clock className="w-3 h-3" />
              <span>Dispatched: {new Date(deliveryJob.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-green-200">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              className="text-green-600 hover:text-green-700 text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            
            {showDetails && (
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700 space-y-1">
                <div><strong>Delivery Job ID:</strong> {deliveryJob.id}</div>
                <div><strong>Provider:</strong> {deliveryJob.provider}</div>
                <div><strong>Status:</strong> {deliveryJob.status}</div>
                <div><strong>Provider Status:</strong> {deliveryJob.providerStatus}</div>
                {deliveryJob.trackingUrl && (
                  <div><strong>Tracking URL:</strong> {deliveryJob.trackingUrl}</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
