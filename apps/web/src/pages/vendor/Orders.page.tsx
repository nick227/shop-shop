// @ts-nocheck
/**
 * VendorOrdersPage - DoorDash/Uber-style vendor order management
 * Real-time order notifications and status management
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { OrderStatus, OrderResponse } from '@api/types'
import { useVendorOrders, usePendingOrderCount } from '@shared/hooks/hooks/vendor/useVendorOrders'
import { useVendorTeamRequest } from '@shared/hooks/hooks/vendor/useVendorTeamRequest'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { useUpdateOrderStatus } from '@shared/hooks/hooks/vendor/useUpdateOrderStatus'
import { usePagination } from '@shared/hooks/hooks/usePagination'
import { Button, Badge, Pagination, SegmentedControl } from '@shared/ui/primitives'
import { SectionHeader } from '@shared/ui/layout/PageLayout'
import { VendorPage } from '@layouts/VendorLayout/page'
import { useSearchParamState } from '@shared/hooks/useSearchParamState'
import { Card, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { VendorOrderCard } from '@features/orders/components/vendor'
import { formatPriceCurrency } from '@shared/lib/utils/format'
import { partitionOrdersByStatus, sortOrdersByDateDesc } from '@shared/lib/utils/orderHelpers'
import { ORDER_STATUS_CONFIG } from '@features/orders/utils/orderUtils'
import { toast } from 'sonner'
import { useStore } from '@shared/hooks/generated'
import { StoreDestinationMap } from '@features/stores/components/StoreMap'
import {
  coerceValidLatLng,
  formatMilesDistance,
  haversineMiles,
  openNavigate,
  openNavigateNewTab,
} from '@shared/lib/utils/maps'
import { useOrderDeliveryLatLng } from '@shared/hooks/useOrderDeliveryLatLng'
import { useHaptics } from '@shared/hooks/useHaptics'
import { Bell, BellOff, Layers } from 'lucide-react'
import { VendorOrdersEmptyState } from './components/VendorOrdersEmptyState'
import { useDeliveryTrackingPolicy } from '@/hooks/useDeliveryTrackingPolicy'

interface DeliveryDriver {
  id: string
  userId: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
  }
}

const STATUS_FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PLACED', label: ORDER_STATUS_CONFIG.PLACED.label },
  { value: 'ACCEPTED', label: ORDER_STATUS_CONFIG.ACCEPTED.label },
  { value: 'PREPARING', label: ORDER_STATUS_CONFIG.PREPARING.label },
  { value: 'READY', label: ORDER_STATUS_CONFIG.READY.label },
  { value: 'OUT_FOR_DELIVERY', label: ORDER_STATUS_CONFIG.OUT_FOR_DELIVERY.label },
  { value: 'COMPLETED', label: ORDER_STATUS_CONFIG.COMPLETED.label },
]

const FILTER_VALUES = STATUS_FILTERS.map((filter) => filter.value)

export default function VendorOrdersPage() {
  const [selectedFilter, setSelectedFilter] = useSearchParamState<OrderStatus | 'ALL'>('status', 'ALL', FILTER_VALUES)
  const [selectedOrder, setSelectedOrder] = useState<string | undefined>()
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const [autoAccept, setAutoAccept] = useState(false)
  const haptics = useHaptics()

  const { selectedStoreId } = useVendorActiveStore()

  const teamRequest = useVendorTeamRequest()
  const { data: driversByStore = {} } = useQuery({
    queryKey: ['store-delivery-drivers', selectedStoreId],
    enabled: Boolean(selectedStoreId),
    queryFn: async () => {
      const { drivers = [] } = await teamRequest<{ drivers?: DeliveryDriver[] }>(`/team/stores/${selectedStoreId}/drivers`)
      return { [selectedStoreId]: drivers }
    },
  })

  // Fetch orders (scoped to active store from layout)
  const {
    data: orders = [],
    isLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useVendorOrders({
    status: selectedFilter === 'ALL' ? undefined : selectedFilter,
    refetchInterval: 30_000,
    storeId: selectedStoreId || undefined,
  })

  // Get pending count
  const { data: pendingCount = 0 } = usePendingOrderCount(selectedStoreId || undefined)

  const updateStatusMutation = useUpdateOrderStatus()

  // Auto-accept new orders
  useEffect(() => {
    if (!autoAccept) return
    
    const pendingOrders = orders.filter(order => order.status === 'PLACED')
    for (const order of pendingOrders) {
      setTimeout(() => {
        handleStatusUpdate(order.id, 'ACCEPTED')
        toast.success('Auto-accepted order #' + order.id.slice(0, 8).toUpperCase())
      }, 1000)
    }
  }, [orders, autoAccept])

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    haptics.medium()
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  const handleStatusUpdateString = (orderId: string, newStatus: string) => {
    handleStatusUpdate(orderId, newStatus as OrderStatus)
  }

  const handleDriverAssign = (orderId: string, driverUserId: string | null) => {
    haptics.medium()
    updateStatusMutation.mutate({ orderId, assignedToUserId: driverUserId })
  }

  const handleBulkStatusUpdate = (status: OrderStatus) => {
    if (selectedOrders.length === 0) return
    haptics.heavy()
    for (const orderId of selectedOrders) {
      updateStatusMutation.mutate({ orderId, status })
    }
    setSelectedOrders([])
    setBulkMode(false)
  }

  const handleOrderSelection = (orderId: string) => {
    haptics.light()
    if (bulkMode) {
      setSelectedOrders(prev => 
        prev.includes(orderId) 
          ? prev.filter(id => id !== orderId)
          : [...prev, orderId]
      )
    } else {
      setSelectedOrder(orderId)
    }
  }

  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    const activeOrders = orders.filter(order => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status))
    let targetOrder: OrderResponse | undefined
    let targetStatus: OrderStatus | undefined

    switch (e.key.toLowerCase()) {
      case 'a': {
        targetOrder = activeOrders.find(order => order.status === 'PLACED')
        targetStatus = 'ACCEPTED'
        break
      }
      case 'p': {
        targetOrder = activeOrders.find(order => order.status === 'ACCEPTED')
        targetStatus = 'PREPARING'
        break
      }
      case 'r': {
        targetOrder = activeOrders.find(order => order.status === 'PREPARING')
        targetStatus = 'READY'
        break
      }
      case '1':
      case '2':
      case '3': {
        const orderIndex = Number.parseInt(e.key) - 1
        if (orderIndex < activeOrders.length) setSelectedOrder(activeOrders[orderIndex].id)
        return
      }
      default: { return
      }
    }

    if (targetOrder && targetStatus) {
      e.preventDefault()
      handleStatusUpdate(targetOrder.id, targetStatus)
    }
  }, [orders, handleStatusUpdate])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [handleKeyboardShortcuts])

  const selectedOrderData = orders.find((o) => o.id === selectedOrder)

  const { pending: pendingOrders } = useMemo(() => {
    return partitionOrdersByStatus(orders)
  }, [orders])

  // Everything not under "Needs action", including out for delivery and delivered.
  const nonPendingOrders = useMemo(() => {
    const pendingIds = new Set(pendingOrders.map((order) => order.id))
    return orders.filter((order) => !pendingIds.has(order.id)).sort(sortOrdersByDateDesc)
  }, [orders, pendingOrders])

  const ordersToShow = selectedFilter === 'ALL' ? nonPendingOrders : orders
  const {
    currentItems: paginatedOrders,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
  } = usePagination(ordersToShow, { pageSize: 20 })

  const filterItems = STATUS_FILTERS.map((filter) => ({
    id: filter.value,
    label: filter.label,
    count: filter.value === 'PLACED' ? pendingCount : undefined,
  }))

  return (
    <VendorPage
      title="Orders"
      description={pendingCount > 0 ? `Live · ${pendingCount} waiting` : 'Live · nothing waiting'}
      loading={isLoading}
      error={ordersError ? { message: 'Orders could not be loaded', onRetry: () => void refetchOrders() } : undefined}
      actions={
        <>
          <Button
            variant="outline"
            size="small"
            aria-pressed={bulkMode}
            onClick={() => { haptics.light(); setBulkMode(!bulkMode); setSelectedOrders([]); }}
          >
            <Layers className="mr-2 h-4 w-4" />
            {bulkMode ? 'Done selecting' : 'Select'}
          </Button>
          <Button
            variant="outline"
            size="small"
            aria-pressed={autoAccept}
            onClick={() => { haptics.light(); setAutoAccept(!autoAccept); }}
          >
            {autoAccept ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
            {autoAccept ? 'Auto-accept on' : 'Auto-accept off'}
          </Button>
        </>
      }
      tabs={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            label="Order status"
            items={filterItems}
            value={selectedFilter}
            onChange={(value) => { haptics.light(); setSelectedFilter(value); }}
          />
          {bulkMode && selectedOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedOrders.length} selected</span>
              <Button size="small" variant="outline" onClick={() => handleBulkStatusUpdate('ACCEPTED')}>{ORDER_STATUS_CONFIG.ACCEPTED.actionLabel || 'Accept'}</Button>
              <Button size="small" variant="outline" onClick={() => handleBulkStatusUpdate('PREPARING')}>{ORDER_STATUS_CONFIG.PREPARING.actionLabel || 'Prep'}</Button>
              <Button size="small" variant="outline" onClick={() => handleBulkStatusUpdate('READY')}>{ORDER_STATUS_CONFIG.READY.actionLabel || 'Ready'}</Button>
            </div>
          )}
        </div>
      }
    >
      {/* Orders View */}
      {orders.length === 0 ? (
        <VendorOrdersEmptyState
          hasFilter={selectedFilter !== 'ALL'}
          filterLabel={selectedFilter === 'ALL' ? undefined : STATUS_FILTERS.find((f) => f.value === selectedFilter)?.label}
          onClearFilter={() => setSelectedFilter('ALL')}
        />
      ) : (
        <div className="space-y-8">
          {/* Priority/Pending Section */}
          {selectedFilter === 'ALL' && pendingOrders.length > 0 && (
            <div className="space-y-4">
              <SectionHeader title="Needs action" />
              <div className="grid gap-3">
                {pendingOrders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    onSelect={() => handleOrderSelection(order.id)}
                    onStatusUpdate={handleStatusUpdateString}
                    onDriverAssign={handleDriverAssign}
                    drivers={(driversByStore[(order as any).storeId] || []).map((member) => ({
                      id: member.userId,
                      name: member.user?.name,
                      email: member.user?.email,
                    }))}
                    isSelected={selectedOrder === order.id}
                    isBulkMode={bulkMode}
                    isBulkSelected={selectedOrders.includes(order.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main List */}
          <div className="space-y-4">
            {selectedFilter !== 'ALL' && (
              <SectionHeader title={STATUS_FILTERS.find(f => f.value === selectedFilter)?.label ?? 'Orders'} />
            )}
            <div className="grid gap-3">
              {paginatedOrders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  onSelect={() => handleOrderSelection(order.id)}
                  onStatusUpdate={handleStatusUpdateString}
                  onDriverAssign={handleDriverAssign}
                  drivers={(driversByStore[(order as any).storeId] || []).map((member) => ({
                    id: member.userId,
                    name: member.user?.name,
                    email: member.user?.email,
                  }))}
                  isSelected={selectedOrder === order.id}
                  isBulkMode={bulkMode}
                  isBulkSelected={selectedOrders.includes(order.id)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 hidden text-xs text-muted-foreground md:block">
        Keyboard: <kbd className="rounded border border-border px-1">A</kbd> accept ·{' '}
        <kbd className="rounded border border-border px-1">P</kbd> prepare ·{' '}
        <kbd className="rounded border border-border px-1">R</kbd> ready ·{' '}
        <kbd className="rounded border border-border px-1">1</kbd>–<kbd className="rounded border border-border px-1">3</kbd> open
      </p>

      {selectedOrderData && (
        <OrderDetailsModal
          order={selectedOrderData}
          onClose={() => setSelectedOrder(undefined)}
        />
      )}
    </VendorPage>
  )
}

function OrderDetailsModal({ order, onClose }: { order: OrderResponse; onClose: () => void }) {
  const storeQuery = useStore(order.storeId)
  const store = storeQuery.data
  const haptics = useHaptics()

  const storeLL = coerceValidLatLng(store ? { latitude: store.latitude, longitude: store.longitude } : undefined)
  const destLL = useOrderDeliveryLatLng(order)
  const canNavigate = Boolean(storeLL && destLL)
  const distanceMi = storeLL && destLL ? haversineMiles(storeLL, destLL) : undefined
  const isTerminal = ['COMPLETED', 'DELIVERED', 'CANCELED'].includes(order.status)
  const trackingPolicy = useDeliveryTrackingPolicy({
    surface: 'vendor-order-detail',
    orderId: order.id,
    storeId: order.storeId,
    terminal: isTerminal,
    invalidateQueryKeys: useMemo(() => [
      ['vendor-orders'],
      ['vendor-pending-orders-count'],
      ['delivery-tracking', order.id],
    ], [order.id]),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => { haptics.light(); onClose(); }} 
      />
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <CardHeader className="border-b border-border/50 sticky top-0 bg-card/80 backdrop-blur-md z-10 p-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {trackingPolicy.isRealtimeConnected
                ? 'Live detail updates connected'
                : trackingPolicy.pollIntervalMs
                  ? `Slow fallback every ${Math.round(trackingPolicy.pollIntervalMs / 1000)}s`
                  : 'Live detail updates paused'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { haptics.light(); onClose(); }} className="rounded-full">✕</Button>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Customer & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer</h3>
              <div>
                <p className="font-bold text-lg">{order.user?.name ?? 'Customer'}</p>
                <p className="text-muted-foreground text-sm">{order.user?.phone || 'No phone'}</p>
                <p className="text-muted-foreground text-sm">{order.user?.email || ''}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery</h3>
              {order.addressSnapshot ? (
                <div className="text-sm">
                  <p className="font-medium text-foreground">{order.addressSnapshot.line1}</p>
                  {order.addressSnapshot.line2 && <p className="text-foreground">{order.addressSnapshot.line2}</p>}
                  <p className="text-muted-foreground">{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.postalCode}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No address provided</p>
              )}
            </div>
          </div>

          {/* Map Section */}
          {canNavigate && (
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Route Map</h3>
                 {distanceMi && <Badge variant="secondary" className="font-mono text-[10px]">{formatMilesDistance(distanceMi)}</Badge>}
               </div>
               <div className="rounded-xl overflow-hidden border border-border bg-muted/20 relative aspect-video sm:aspect-auto sm:h-[220px]">
                  <StoreDestinationMap
                    store={{ latitude: storeLL!.latitude, longitude: storeLL!.longitude, label: store?.name ?? 'Store' }}
                    destination={{ latitude: destLL!.latitude, longitude: destLL!.longitude, label: 'Delivery' }}
                    height="100%"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <Button variant="primary" size="small" className="flex-1 shadow-lg" onClick={() => openNavigate({ origin: storeLL!, destination: destLL!, destinationLabel: 'Delivery' })}>Navigate</Button>
                    <Button variant="outline" size="small" className="flex-1 shadow-lg bg-card" onClick={() => openNavigateNewTab({ origin: storeLL!, destination: destLL!, destinationLabel: 'Delivery' })}>New Tab</Button>
                  </div>
               </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order Items</h3>
            <div className="bg-muted/30 rounded-xl p-4 divide-y divide-border/30">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between py-2 first:pt-0 last:pb-0 text-sm">
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">{item.quantity}×</span>
                    <span className="font-medium">{item.titleSnapshot}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{formatPriceCurrency(item.unitPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Summary</h3>
            <div className="space-y-2 text-sm px-1">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPriceCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery & Fees</span><span>{formatPriceCurrency(order.fees)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatPriceCurrency(order.tax)}</span></div>
              {Number(order.tip) > 0 && <div className="flex justify-between text-success font-medium"><span>Tip</span><span>{formatPriceCurrency(order.tip)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatPriceCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t border-border/50 bg-muted/10 flex gap-3">
           <Button variant="outline" className="flex-1 h-12" onClick={onClose}>Close</Button>
           {/* Add dynamic status actions here if needed */}
        </div>
      </Card>
    </div>
  )
}
