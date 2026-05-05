/**
 * CustomerDeliveriesPage - Track delivery orders
 * Shows active deliveries and delivery history
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@shared/hooks/generated'
import { useCustomerRealtimeOrder } from '@shared/hooks/hooks/useCustomerRealtimeOrder'
import { useAuth } from '@features/auth/hooks/useAuth'
import { OrderCard } from '@features/orders/components/OrderCard'
import { Button, Spinner, Badge } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
import { getOrderAge, getEstimatedReadyTime } from '@shared/lib/utils/orderHelpers'
import { Truck, Clock, MapPin, Package } from 'lucide-react'
import type { AddressSnapshot } from '@api/types'

function getStatusBadge(status: string) {
  switch (status) {
    case 'PLACED': { return { label: 'Placed', variant: 'warning' as const }
    }
    case 'ACCEPTED': { return { label: 'Accepted', variant: 'default' as const }
    }
    case 'PREPARING': { return { label: 'Preparing', variant: 'default' as const }
    }
    case 'READY': { return { label: 'Ready', variant: 'success' as const }
    }
    default: { return { label: status, variant: 'secondary' as const }
    }
  }
}

export default function CustomerDeliveriesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: orders, isLoading } = useOrders()
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  useCustomerRealtimeOrder({
    userId: user?.id,
    enableToast: true,
  } as any)

  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="large" />
        <p className="mt-4 text-muted-foreground text-sm">Loading deliveries...</p>
      </PageContainer>
    )
  }

  const deliveryOrders = orders?.filter(o => o.deliveryType === 'DELIVERY') || []
  const activeDeliveries = deliveryOrders.filter(o =>
    ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o?.status)
  )
  const deliveryHistory = deliveryOrders.filter(o =>
    ['COMPLETED', 'CANCELED'].includes(o?.status)
  )

  return (
    <PageContainer>
      <PageHeader title="My Deliveries" description="Track your delivery orders" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active
          {activeDeliveries.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full font-semibold">
              {activeDeliveries.length}
            </span>
          )}
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Active Deliveries */}
      {activeTab === 'active' && (
        <div className="flex flex-col gap-3">
          {activeDeliveries.length > 0 ? (
            activeDeliveries.map(order => {
              const orderAge = getOrderAge(order?.createdAt)
              const eta = getEstimatedReadyTime(order.createdAt, 30)
              const badge = getStatusBadge(order.status)

              return (
                <Card key={order.id}>
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-base font-semibold tracking-tight mb-0.5">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-muted-foreground">Restaurant</p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    <div className="flex flex-col gap-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Ordered:</span>
                        <span className="font-medium">{orderAge.display}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="font-medium">{(eta as any).display || eta.toString()}</span>
                      </div>
                      {order.addressSnapshot && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-medium">{(order.addressSnapshot as AddressSnapshot).line1}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => navigate('/orders/' + order.id)}
                        className="flex-1"
                      >
                        Track Live
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => navigate('/orders/' + order.id)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <EmptyState
              icon={Truck}
              title="No active deliveries"
              description="Your active delivery orders will appear here"
              action={
                <Button variant="primary" onClick={() => navigate('/')}>Order Now</Button>
              }
            />
          )}
        </div>
      )}

      {/* Delivery History */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          {deliveryHistory.length > 0 ? (
            deliveryHistory.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={(id) => navigate('/orders/' + id)}
              />
            ))
          ) : (
            <EmptyState
              icon={Package}
              title="No delivery history"
              description="Past delivery orders will appear here"
            />
          )}
        </div>
      )}
    </PageContainer>
  )
}
