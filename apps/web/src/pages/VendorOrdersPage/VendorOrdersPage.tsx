/**
 * VendorOrdersPage - DoorDash/Uber-style vendor order management
 * Real-time order notifications and status management
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../../api/orders'
import { useVendorRealtimeOrders } from '../../hooks/vendor/useVendorRealtimeOrders'
import { useAuth } from '../../hooks/useAuth'
import { usePagination } from '../../hooks/usePagination'
import { Button, Badge, Spinner, Pagination } from '../../components/ui'
import { VendorOrderCard } from '../../features/orders/components/vendor'
import { formatPriceCurrency } from '../../utils/format'
import { toast } from 'sonner'
import type { OrderResponse } from '../../api/types'
import type { UpdateOrderRequestStatusEnum, UpdateOrderRequest } from '@api/types'

type OrderStatus = UpdateOrderRequestStatusEnum

interface VendorUser {
  storeId?: string
}

const STATUS_FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PENDING', label: 'New' },
  { value: 'CONFIRMED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Completed' },
]

export default function VendorOrdersPage() {
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<string | undefined>()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get vendor's store ID
  const { data: vendorData } = useQuery({
    queryKey: ['vendor-store'],
    queryFn: async () => {
      // Assuming user has storeId or we fetch it from stores endpoint
      return { storeId: (user as VendorUser)?.storeId || '' }
    },
  })

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<OrderResponse[]>({
    queryKey: ['vendor-orders', selectedFilter],
    queryFn: async () => {
      const filterStatus = selectedFilter === 'ALL' ? undefined : selectedFilter
      const response = await ordersApi.getVendorOrders(filterStatus)
      return (response.data || []) as unknown as OrderResponse[]
    },
    refetchInterval: 10_000, // Fallback polling
  })

  // Get pending count
  const { data: pendingCount } = useQuery({
    queryKey: ['vendor-pending-orders-count'],
    queryFn: () => ordersApi.getPendingOrdersCount(),
    refetchInterval: 5000,
  })

  // Real-time subscriptions
  useVendorRealtimeOrders({
    storeId: vendorData?.storeId,
    enableSound: true,
    enableDesktopNotification: true,
  })

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string; status: OrderStatus; note?: string }) =>
      ordersApi.updateOrderStatus(orderId, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-pending-orders-count'] })
      toast.success('Order status updated')
    },
    onError: () => {
      toast.error('Failed to update order status')
    },
  })

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  const handleStatusUpdateString = (orderId: string, newStatus: string) => {
    handleStatusUpdate(orderId, newStatus as OrderStatus)
  }

  const selectedOrderData = orders.find((o) => o.id === selectedOrder)

  // Partition orders in SINGLE PASS (was 2+ separate filters)
  // Optimization: Eliminates duplicate renders of pending orders
  const { pendingOrders, nonPendingOrders } = useMemo(() => {
    const pending: OrderResponse[] = []
    const nonPending: OrderResponse[] = []
    
    for (const order of orders) {
      if (['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status)) {
        pending.push(order)
      } else {
        nonPending.push(order)
      }
    }
    
    return { pendingOrders: pending, nonPendingOrders: nonPending }
  }, [orders])

  // Pagination for non-pending orders
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
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Spinner />
        <p className="text-gray-600">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold m-0">Orders</h1>
          <p className="text-gray-600 mt-2 mb-0">
            {pendingCount?.count || 0} pending order{pendingCount?.count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Badge variant="default">
            🔴 Live
          </Badge>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            className={
              'px-6 py-3 border-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 transition-all ' +
              (selectedFilter === filter.value 
                ? 'border-blue-600 bg-blue-600 text-white' 
                : 'border-gray-300 bg-white hover:border-blue-600 hover:bg-blue-50')
            }
            onClick={() => setSelectedFilter(filter.value)}
          >
            {filter.label}
            {filter.value === 'PENDING' && pendingCount?.count ? (
              <Badge variant="destructive">{pendingCount.count}</Badge>
            ) : undefined}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Pending Orders (Priority) */}
          {selectedFilter === 'ALL' && pendingOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">⚡ Pending Orders</h2>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    onSelect={() => setSelectedOrder(order.id)}
                    onStatusUpdate={handleStatusUpdateString}
                    isSelected={selectedOrder === order.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Non-Pending Orders (avoid duplicate renders) */}
          <div className="mb-8">
            {selectedFilter !== 'ALL' && <h2 className="text-xl font-semibold mb-4">{STATUS_FILTERS.find(f => f.value === selectedFilter)?.label}</h2>}
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  onSelect={() => setSelectedOrder(order.id)}
                  onStatusUpdate={handleStatusUpdateString}
                  isSelected={selectedOrder === order.id}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8">
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

      {/* Order Details Modal/Drawer */}
      {selectedOrderData && (
        <OrderDetailsModal
          order={selectedOrderData}
          onClose={() => setSelectedOrder(undefined)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}

// Order Details Modal Component with Tailwind
interface OrderDetailsModalProps {
  readonly order: OrderResponse
  readonly onClose: () => void
  readonly onStatusUpdate?: (orderId: string, status: OrderStatus) => void
}

function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Order details modal"
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        role="document"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Customer</h3>
            <p className="text-gray-900">{order.user?.name ?? 'Customer'}</p>
            {order.user?.phone && <p className="text-gray-600">📞 {order.user.phone}</p>}
            {order.user?.email && <p className="text-gray-600">📧 {order.user.email}</p>}
          </div>

          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Items</h3>
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between py-1">
                <span className="text-gray-900">{item.quantity}x {item.titleSnapshot}</span>
                <span className="font-medium">{formatPriceCurrency(item.unitPrice)}</span>
              </div>
            ))}
          </div>

          {order.deliveryType === 'DELIVERY' && order.addressSnapshot && (
            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Delivery Address</h3>
              <p className="text-gray-900">{order.addressSnapshot.line1}</p>
              {order.addressSnapshot.line2 && <p className="text-gray-900">{order.addressSnapshot.line2}</p>}
              <p className="text-gray-900">{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.postalCode}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Order Total</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatPriceCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Delivery:</span><span>{formatPriceCurrency(order.fees)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax:</span><span>{formatPriceCurrency(order.tax)}</span></div>
              {Number.parseFloat(String(order.tip)) > 0 && <div className="flex justify-between text-sm"><span>Tip:</span><span>{formatPriceCurrency(order.tip || 0)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>{formatPriceCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
