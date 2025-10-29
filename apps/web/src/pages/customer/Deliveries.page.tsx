/**
 * CustomerDeliveriesPage - Track delivery orders
 * Shows active deliveries and delivery history
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@hooks/generated'
import { useCustomerRealtimeOrder } from '@hooks/useCustomerRealtimeOrder'
import { useAuth } from '@hooks/useAuth'
import { OrderCard } from '../../features/orders/components/OrderCard'
import { Button, Spinner, Card } from '@ui'
import { getOrderAge, getEstimatedReadyTime } from '@utils/orderHelpers'
import type { AddressSnapshot } from '@api/types'

export default function CustomerDeliveriesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: orders, isLoading } = useOrders()
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // Subscribe to real-time updates
  useCustomerRealtimeOrder({
    userId: user?.id,
    enableToast: true,
  } as any)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Spinner size="large" />
        <p className="text-gray-600">Loading deliveries...</p>
      </div>
    )
  }

  // Filter delivery orders only
  const deliveryOrders = orders?.filter(o => o.deliveryType === 'DELIVERY') || []

  // Separate active and completed deliveries
  const activeDeliveries = deliveryOrders.filter(o =>
    ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o?.status)
  )

  const deliveryHistory = deliveryOrders.filter(o =>
    ['COMPLETED', 'CANCELED'].includes(o?.status)
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Deliveries</h1>
          <p className="text-gray-600">Track your delivery orders</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          className={
            'flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-all ' +
            (activeTab === 'active' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900')
          }
          onClick={() => setActiveTab('active')}
        >
          <span className="text-lg">⚡</span>
          <span>Active</span>
          {activeDeliveries.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeDeliveries.length}
            </span>
          )}
        </button>

        <button
          className={
            'flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-all ' +
            (activeTab === 'history' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900')
          }
          onClick={() => setActiveTab('history')}
        >
          <span className="text-lg">📋</span>
          <span>History</span>
        </button>
      </div>

      {/* Active Deliveries */}
      {activeTab === 'active' && (
        <div>
          {activeDeliveries.length > 0 ? (
            <div className="space-y-4">
              {activeDeliveries.map(order => {
                const orderAge = getOrderAge(order?.createdAt)
                const eta = getEstimatedReadyTime(order.createdAt, 30)

                return (
                  <Card key={order.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-gray-600">Restaurant</p>
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {order.status === 'PLACED' && '📋 Placed'}
                          {order.status === 'ACCEPTED' && '✅ Accepted'}
                          {order.status === 'PREPARING' && '👨‍🍳 Preparing'}
                          {order.status === 'READY' && '🎉 Ready'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">⏱️</span>
                        <span className="text-gray-600">Ordered:</span>
                        <span className="font-medium">{orderAge.display}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎯</span>
                        <span className="text-gray-600">ETA:</span>
                        <span className="font-medium">{(eta as any).display || eta.toString()}</span>
                      </div>

                      {order.addressSnapshot && (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📍</span>
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">
                            {(order.addressSnapshot as AddressSnapshot).line1}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => navigate('/orders/' + order.id + '')}
                        className="flex-1"
                      >
                        🔴 Track Live
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => navigate('/orders/' + order.id + '')}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-6xl mb-4">🚗</span>
              <h3 className="text-xl font-bold mb-2">No active deliveries</h3>
              <p className="text-gray-600 mb-6">
                Your active delivery orders will appear here
              </p>
              <Button variant="primary" onClick={() => navigate('/')}>
                Order Now
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Delivery History */}
      {activeTab === 'history' && (
        <div>
          {deliveryHistory.length > 0 ? (
            <div className="space-y-4">
              {deliveryHistory.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={(id) => navigate('/orders/' + id + '')}
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-6xl mb-4">📦</span>
              <h3 className="text-xl font-bold mb-2">No delivery history</h3>
              <p className="text-gray-600">
                Past delivery orders will appear here
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

