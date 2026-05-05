/**
 * OrderHistoryPage - View past orders with real-time updates
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@shared/hooks/hooks/useStores'
import { useCustomerRealtimeOrder } from '@shared/hooks/hooks/useCustomerRealtimeOrder'
import { usePaginatedList } from '@shared/hooks/usePaginatedList'
import { useAuth } from '@features/auth/hooks/useAuth'
import { OrderCard } from '@features/orders/components/OrderCard'
import { OrderDetailModal } from '@features/orders/components/OrderDetailModal'
import { Button, Spinner, Pagination } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
import { sortOrdersByDateDesc } from '@shared/lib/utils/orderHelpers'
import { Package, ArrowLeft } from 'lucide-react'

export default function OrderHistoryPage() {
  const { data: orders, isLoading, error } = useOrders()
  const navigate = useNavigate()
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>()
  const { user } = useAuth()

  useCustomerRealtimeOrder({
    userId: user?.id,
    enableToast: true,
  } as any)

  const paginatedList = usePaginatedList({
    items: (orders || []) as any,
    pageSize: 20,
    sortFn: sortOrdersByDateDesc as any,
  })

  const handleBack = useCallback(() => navigate('/'), [navigate])
  const handleOrderClick = useCallback((orderId: string) => {
    setSelectedOrderId(orderId)
  }, [])
  const handleCloseModal = useCallback(() => {
    setSelectedOrderId(undefined)
  }, [])

  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="large" />
        <p className="mt-4 text-muted-foreground text-sm">Loading your orders...</p>
      </PageContainer>
    )
  }

  const isEmpty = !orders || orders.length === 0

  return (
    <PageContainer>
      <PageHeader
        title="Order History"
        description={!isEmpty ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}` : undefined}
        backButton={
          <Button variant="ghost" size="small" onClick={handleBack} className="-ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Button>
        }
      />

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-destructive text-center">
          <h2 className="text-lg font-semibold">Error Loading Orders</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {isEmpty && !error && (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Your order history will appear here after you place your first order."
          action={
            <Button variant="primary" onClick={handleBack}>
              Start Shopping
            </Button>
          }
        />
      )}

      {!isEmpty && !error && (
        <>
          <div className="flex flex-col gap-3">
            {paginatedList.items.map((order) => (
              <OrderCard key={order.id as string} order={order as any} onClick={handleOrderClick} />
            ))}
          </div>

          {paginatedList.pagination.totalPages > 1 && (
            <Pagination
              currentPage={paginatedList.pagination.currentPage}
              totalItems={paginatedList.pagination.totalItems}
              pageSize={paginatedList.pagination.pageSize}
              onPageChange={paginatedList.pagination.goToPage}
              showPageSize
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={paginatedList.pagination.setPageSize}
            />
          )}
        </>
      )}

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={handleCloseModal}
        />
      )}
    </PageContainer>
  )
}
