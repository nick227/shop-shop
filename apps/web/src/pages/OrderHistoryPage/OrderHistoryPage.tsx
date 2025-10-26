/**
 * OrderHistoryPage - View past orders with real-time updates
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@hooks/generated'
import { useCustomerRealtimeOrder } from '@hooks/useCustomerRealtimeOrder'
import { usePaginatedList } from '@hooks/usePaginatedList'
import { useAuth } from '@hooks/useAuth'
import { OrderCard } from '../../features/orders/components/OrderCard'
import { OrderDetailModal } from '../../features/orders/components/OrderDetailModal'
import { Button, Spinner, Pagination } from '@ui'
import { sortOrdersByDateDesc } from '@utils/orderHelpers'
import { styles } from '@utils/tailwind-classes'

export default function OrderHistoryPage() {
  const { data: orders, isLoading, error } = useOrders()
  const navigate = useNavigate()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { user } = useAuth()

  // Subscribe to real-time order updates for this customer
  useCustomerRealtimeOrder({
    userId: user?.id,
    enableToast: true,
  } as any)

  // Unified pagination handler (sorts by newest first using consolidated helper)
  const paginatedList = usePaginatedList({
    items: (orders || []) as any,
    pageSize: 20,
    sortFn: sortOrdersByDateDesc as any,
  })

  // Memoized handlers
  const handleBack = useCallback(() => navigate('/'), [navigate])
  
  const handleOrderClick = useCallback((orderId: string) => {
    setSelectedOrderId(orderId)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedOrderId(null)
  }, [])

  if (isLoading) {
    return (
      <div className={styles['loading']}>
        <Spinner size="large" />
        <p>Loading your orders...</p>
      </div>
    )
  }

  const isEmpty = !orders || orders.length === 0

  return (
    <div className={styles['container']}>
      <header className={styles['header']}>
        <div className={styles['headerContent']}>
          <div>
            <h1 className={styles['title']}>Order History</h1>
            {!isEmpty && (
              <p className={styles['subtitle']}>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
            )}
          </div>
          <Button variant="ghost" onClick={handleBack}>
            ← Back to Home
          </Button>
        </div>
      </header>

      <main className={styles['content']}>
        {error && (
          <div className={styles['error']}>
            <h2>Error Loading Orders</h2>
            <p>{error.message}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {isEmpty && !error && (
          <div className={styles['empty']}>
            <div className={styles['emptyIcon']}>📦</div>
            <h2 className={styles['emptyTitle']}>No orders yet</h2>
            <p className={styles['emptyText']}>
              Your order history will appear here after you place your first order.
            </p>
            <Button variant="primary" size="large" onClick={handleBack}>
              Start Shopping
            </Button>
          </div>
        )}

        {!isEmpty && !error && (
          <>
            <div className={styles['list']}>
              {paginatedList.items.map((order) => (
                <OrderCard key={order['id'] as string} order={order as any} onClick={handleOrderClick} />
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
      </main>

      {selectedOrderId && (
        <OrderDetailModal 
          orderId={selectedOrderId} 
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

