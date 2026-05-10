import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@shared/ui/primitives'
import { 
  Truck, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  ExternalLink,
  Eye,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { formatPriceCurrency } from '@shared/lib/utils/format'
import { useNavigate } from 'react-router-dom'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface DeliveryStats {
  activeDeliveries: number
  failedDeliveries: number
  stuckDeliveries: number
  totalDeliveries: number
  providerSplit: {
    doordash: number
    inhouse: number
  }
  readyNotDispatched: number
  avgDeliveryTime: string | null
  avgDeliveryFee: string
}

interface DeliveryJob {
  id: string
  provider: string
  status: string
  providerExternalId: string
  trackingUrl: string
  providerStatus: string
  feeCents: number
  createdAt: string
  updatedAt: string
  order: {
    id: string
    status: string
    userId: string
    storeId: string
    total: number
    createdAt: string
  }
}

interface DeliveryEvent {
  id: string
  deliveryJobId: string
  provider: string
  eventId: string
  eventType: string
  timestamp: string
  processed: boolean
  payload: unknown
  deliveryJob: {
    id: string
    provider: string
    order: {
      id: string
      userId: string
      storeId: string
    }
  }
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'default' | 'success' | 'warning' | 'destructive'
}

function StatCard({ title, value, icon: Icon, description, trend, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-blue-600 bg-blue-50 border-blue-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    destructive: 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <Card className={`border-l-4 ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={`flex items-center text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`w-3 h-3 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
                {trend.isPositive ? '+' : ''}{trend.value}%
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status.toLowerCase()) {
    case 'delivered': return 'success'
    case 'canceled': return 'destructive'
    case 'failed': return 'destructive'
    case 'dispatched': return 'default'
    case 'out_for_delivery': return 'default'
    case 'ready': return 'warning'
    default: return 'secondary'
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered': return <CheckCircle className="w-4 h-4" />
    case 'canceled': return <XCircle className="w-4 h-4" />
    case 'failed': return <AlertCircle className="w-4 h-4" />
    case 'dispatched': return <Truck className="w-4 h-4" />
    case 'out_for_delivery': return <Package className="w-4 h-4" />
    case 'ready': return <Clock className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}

export default function DeliveryOperationsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'failed' | 'events'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const token = localStorage.getItem('token') || ''
  const apiBase = getApiBase()

  // Fetch delivery stats
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<DeliveryStats>({
    queryKey: ['admin-delivery-stats'],
    queryFn: async () => {
      const response = await fetch(`${apiBase}/api/admin/delivery/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch delivery stats')
      return response.json()
    },
    refetchInterval: 30000, // 30 seconds
  })

  // Fetch delivery jobs
  const { data: deliveryJobsData, isLoading: isLoadingDeliveries, refetch: refetchDeliveries } = useQuery<{
    deliveryJobs: DeliveryJob[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>({
    queryKey: ['admin-delivery-jobs', page, pageSize, statusFilter, providerFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(providerFilter !== 'all' && { provider: providerFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`${apiBase}/api/admin/delivery/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch delivery jobs')
      
      return response.json()
    },
    refetchInterval: 30000 // 30 seconds
  })

  // Fetch delivery events
  const { data: eventsData, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery<{
    events: DeliveryEvent[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>({
    queryKey: ['admin-delivery-events', page, pageSize, providerFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(providerFilter !== 'all' && { provider: providerFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`${apiBase}/api/admin/delivery/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch delivery events')
      
      return response.json()
    },
    refetchInterval: 30000 // 30 seconds
  })

  // Manual refresh mutation
  const refreshDeliveryStatusMutation = useMutation({
    mutationFn: async (deliveryJobId: string) => {
      const response = await fetch(`${apiBase}/api/admin/delivery/jobs/${deliveryJobId}/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to refresh delivery status')
      
      return response.json()
    },
    onSuccess: () => {
      refetchDeliveries()
      refetchStats()
    }
  })

  const deliveryJobs = deliveryJobsData?.deliveryJobs ?? []
  const deliveryEvents = eventsData?.events ?? []
  const totalDeliveries = deliveryJobsData?.pagination?.total || 0

  // Filter jobs based on active tab
  const filteredJobs = deliveryJobs.filter(job => {
    switch (activeTab) {
      case 'active':
        return ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(job.status)
      case 'failed':
        return ['FAILED', 'CANCELED'].includes(job.status)
      default:
        return true
    }
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Operations</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage delivery operations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              refetchStats()
              refetchDeliveries()
              refetchEvents()
            }}
            disabled={isLoadingStats || isLoadingDeliveries}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats || isLoadingDeliveries ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {activeTab === 'overview' && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Deliveries"
            value={stats.activeDeliveries}
            icon={Truck}
            description="Currently in progress"
            color="default"
          />
          <StatCard
            title="Failed Deliveries"
            value={stats.failedDeliveries}
            icon={XCircle}
            description="Failed or canceled today"
            color="destructive"
          />
          <StatCard
            title="Stuck Deliveries"
            value={stats.stuckDeliveries}
            icon={AlertCircle}
            description="Older than 2 hours"
            color="warning"
          />
          <StatCard
            title="Ready to Dispatch"
            value={stats.readyNotDispatched}
            icon={Clock}
            description="Orders awaiting dispatch"
            color="warning"
          />
          <StatCard
            title="Total Deliveries"
            value={stats.totalDeliveries}
            icon={Package}
            description="All deliveries today"
          />
          <StatCard
            title="DoorDash"
            value={stats.providerSplit.doordash}
            icon={Truck}
            description="DoorDash deliveries"
          />
          <StatCard
            title="In-House"
            value={stats.providerSplit.inhouse}
            icon={Users}
            description="In-house deliveries"
          />
          <StatCard
            title="Avg Delivery Fee"
            value={`$${stats.avgDeliveryFee}`}
            icon={DollarSign}
            description="Average fee today"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          type="text"
          placeholder="Search by order ID or tracking..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
          className="h-9 w-64"
        />
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="DISPATCHED">Dispatched</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={(value) => { setProviderFilter(value); setPage(1) }}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="DOORDASH_DRIVE">DoorDash</SelectItem>
            <SelectItem value="IN_HOUSE">In-House</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'active', label: 'Active' },
          { key: 'failed', label: 'Failed' },
          { key: 'events', label: 'Events' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Delivery Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDeliveries ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {deliveryJobs.slice(0, 10).map((job) => (
                        <tr key={job.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/admin/orders/${job.order.id}`)}
                              className="font-medium text-primary hover:underline"
                            >
                              {job.order.id}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{job.provider}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getStatusColor(job.status)}>
                              <span className="mr-1">{getStatusIcon(job.status)}</span>
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(job.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                size="small"
                                variant="outline"
                                onClick={() => navigate(`/admin/orders/${job.order.id}`)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Order
                              </Button>
                              {job.trackingUrl && (
                                <Button
                                  size="small"
                                  variant="outline"
                                  onClick={() => window.open(job.trackingUrl, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Track
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outline"
                                onClick={() => refreshDeliveryStatusMutation.mutate(job.id)}
                                disabled={refreshDeliveryStatusMutation.isPending}
                              >
                                <RefreshCw className={`w-3 h-3 mr-1 ${refreshDeliveryStatusMutation.isPending ? 'animate-spin' : ''}`} />
                                Refresh
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Deliveries ({filteredJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/admin/orders/${job.order.id}`)}
                            className="font-medium text-primary hover:underline"
                          >
                            {job.order.id}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{job.provider}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusColor(job.status)}>
                            <span className="mr-1">{getStatusIcon(job.status)}</span>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="small"
                              variant="outline"
                              onClick={() => navigate(`/admin/orders/${job.order.id}`)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Order
                            </Button>
                            {job.trackingUrl && (
                              <Button
                                size="small"
                                variant="outline"
                                onClick={() => window.open(job.trackingUrl, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Track
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'failed' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed & Canceled Deliveries ({filteredJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/admin/orders/${job.order.id}`)}
                            className="font-medium text-primary hover:underline"
                          >
                            {job.order.id}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{job.provider}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusColor(job.status)}>
                            <span className="mr-1">{getStatusIcon(job.status)}</span>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => navigate(`/admin/orders/${job.order.id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Order
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Provider Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-3">Event ID</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Event Type</th>
                        <th className="px-4 py-3">Delivery Job</th>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Processed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {deliveryEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs">
                            {event.eventId}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{event.provider}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">{event.eventType}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/admin/orders/${event.deliveryJob.order.id}`)}
                              className="font-medium text-primary hover:underline"
                            >
                              {event.deliveryJobId}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={event.processed ? 'success' : 'warning'}>
                              {event.processed ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
