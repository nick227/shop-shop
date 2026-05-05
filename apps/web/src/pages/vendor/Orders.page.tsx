// @ts-nocheck
/**
 * VendorOrdersPage - DoorDash/Uber-style vendor order management
 * Real-time order notifications and status management
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import type { OrderStatus, OrderResponse, StoreResponse } from '@api/types'
import { useVendorRealtimeOrders } from '@shared/hooks/hooks/vendor/useVendorRealtimeOrders'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useVendorOrders, usePendingOrderCount } from '@shared/hooks/hooks/vendor/useVendorOrders'
import { useVendorStores } from '@shared/hooks/hooks/vendor/useVendorStores'
import { useUpdateOrderStatus } from '@shared/hooks/hooks/vendor/useUpdateOrderStatus'
import { usePagination } from '@shared/hooks/hooks/usePagination'
import { Button, Badge, Spinner, Pagination } from '@shared/ui/primitives'
import { PageContainer, PageHeader, SectionHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { VendorOrderCard } from '@features/orders/components/vendor'
import { formatPriceCurrency } from '@shared/lib/utils/format'
import { partitionOrdersByStatus, sortOrdersByDateDesc } from '@shared/lib/utils/orderHelpers'
import { ORDER_STATUS_CONFIG, getOrderStatusConfig } from '@features/orders/utils/orderUtils'
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
import { cn } from '@shared/lib/cn'
import { Activity, Bell, BellOff, Layers, MousePointer2 } from 'lucide-react'
import { VendorOrdersEmptyState } from './components/VendorOrdersEmptyState'

const STATUS_FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PLACED', label: ORDER_STATUS_CONFIG.PLACED.label },
  { value: 'ACCEPTED', label: ORDER_STATUS_CONFIG.ACCEPTED.label },
  { value: 'PREPARING', label: ORDER_STATUS_CONFIG.PREPARING.label },
  { value: 'READY', label: ORDER_STATUS_CONFIG.READY.label },
  { value: 'OUT_FOR_DELIVERY', label: ORDER_STATUS_CONFIG.OUT_FOR_DELIVERY.label },
  { value: 'COMPLETED', label: ORDER_STATUS_CONFIG.COMPLETED.label },
]

export default function VendorOrdersPage() {
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<string | undefined>()
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const [autoAccept, setAutoAccept] = useState(false)
  const { user } = useAuth()
  const haptics = useHaptics()

  const { data: vendorStores = [] } = useVendorStores()
  const vendorStoreIds = useMemo(() => vendorStores.map((s: any) => s.id).filter(Boolean), [vendorStores])

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useVendorOrders({
    status: selectedFilter === 'ALL' ? undefined : selectedFilter,
    refetchInterval: 3000,
  })

  // Get pending count
  const { data: pendingCount = 0 } = usePendingOrderCount()

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

  // Real-time subscriptions
  useVendorRealtimeOrders({
    storeIds: vendorStoreIds,
    enableSound: true,
    enableDesktopNotification: true,
  })

  const updateStatusMutation = useUpdateOrderStatus()

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    haptics.medium()
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  const handleStatusUpdateString = (orderId: string, newStatus: string) => {
    handleStatusUpdate(orderId, newStatus as OrderStatus)
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

  const { pending: pendingOrders, completed: completedOrders, canceled: canceledOrders } = useMemo(() => {
    return partitionOrdersByStatus(orders)
  }, [orders])

  const nonPendingOrders = useMemo(() => {
    return [...completedOrders, ...canceledOrders].sort(sortOrdersByDateDesc)
  }, [completedOrders, canceledOrders])

  const ordersToShow = selectedFilter === 'ALL' ? nonPendingOrders : orders
  const {
    currentItems: paginatedOrders,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
  } = usePagination(ordersToShow, { pageSize: 20 })

  if (isLoading) {
    return (
      <PageContainer>
        <VendorOrdersEmptyState isLoading={true} />
      </PageContainer>
    )
  }

  if (ordersError) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-xl font-semibold">Failed to load orders</h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          {(ordersError as any)?.message ?? 'Network error'}
        </p>
        <Button variant="outline" onClick={() => void refetchOrders()}>
          Try Again
        </Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Orders"
        description={`${pendingCount} pending orders • Real-time processing`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={autoAccept ? "primary" : "outline"}
              size="small"
              onClick={() => { haptics.light(); setAutoAccept(!autoAccept); }}
              className="h-9"
            >
              {autoAccept ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
              {autoAccept ? 'Auto-Accept ON' : 'Auto-Accept'}
            </Button>
            <Badge variant="success" className="h-9 px-3 gap-1.5 bg-success/10 text-success border-success/20 animate-pulse-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Live
            </Badge>
          </div>
        }
      />

      {/* Shortcuts & Info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-2">
            <MousePointer2 className="w-3 h-3" />
            Quick Actions: <kbd className="px-1 py-0.5 bg-background rounded border shadow-sm">A</kbd> Accept • 
            <kbd className="px-1 py-0.5 bg-background rounded border shadow-sm">P</kbd> Prepare • 
            <kbd className="px-1 py-0.5 bg-background rounded border shadow-sm">R</kbd> Ready • 
            <kbd className="px-1 py-0.5 bg-background rounded border shadow-sm">1-3</kbd> Select
          </p>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-muted/50 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar max-w-full">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? 'primary' : 'ghost'}
              size="small"
              onClick={() => { haptics.light(); setSelectedFilter(filter.value); }}
              className="capitalize text-xs h-9 px-4 whitespace-nowrap"
            >
              {filter.label}
              {filter.value === 'PLACED' && pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 min-w-4 px-1 text-[10px]">{pendingCount}</Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={bulkMode ? "primary" : "outline"}
            size="small"
            onClick={() => { haptics.light(); setBulkMode(!bulkMode); setSelectedOrders([]); }}
            className="flex-1 sm:flex-none h-9"
          >
            <Layers className="w-4 h-4 mr-2" />
            {bulkMode ? 'Exit Bulk' : 'Bulk Mode'}
          </Button>
          {bulkMode && selectedOrders.length > 0 && (
             <div className="flex items-center gap-1 animate-in slide-in-from-right-4 duration-300">
               <Button size="small" variant="primary" onClick={() => handleBulkStatusUpdate('ACCEPTED')} className="h-9">{ORDER_STATUS_CONFIG.ACCEPTED.actionLabel || 'Accept'}</Button>
               <Button size="small" variant="primary" onClick={() => handleBulkStatusUpdate('PREPARING')} className="h-9">{ORDER_STATUS_CONFIG.PREPARING.actionLabel || 'Prep'}</Button>
               <Button size="small" variant="primary" onClick={() => handleBulkStatusUpdate('READY')} className="h-9">{ORDER_STATUS_CONFIG.READY.actionLabel || 'Ready'}</Button>
             </div>
          )}
        </div>
      </div>

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
              <SectionHeader title="⚡ Priority Processing" />
              <div className="grid gap-3">
                {pendingOrders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    onSelect={() => handleOrderSelection(order.id)}
                    onStatusUpdate={handleStatusUpdateString}
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

      {selectedOrderData && (
        <OrderDetailsModal
          order={selectedOrderData}
          onClose={() => setSelectedOrder(undefined)}
        />
      )}
    </PageContainer>
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
