import { useCallback, useMemo, useState } from 'react'
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
  Download,
  Clock,
  MapPin,
  Activity
} from 'lucide-react'
import { formatPriceCurrency } from '@shared/lib/utils/format'
import { useDeliveryTrackingPolicy } from '@/hooks/useDeliveryTrackingPolicy'
import { authFetch } from '@shared/lib/auth/authFetch'

interface DeliveryJob {
  id: string
  provider: string
  status: string
  providerExternalId: string
  trackingUrl: string
  providerStatus: string
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

interface PageInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface DeliveryJobsResponse {
  deliveryJobs: DeliveryJob[]
  pagination: PageInfo
}

interface DeliveryEventsResponse {
  events: DeliveryEvent[]
  pagination: PageInfo
}

export default function DeliveryEventViewerPage() {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'events'>('deliveries')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [liveMode, setLiveMode] = useState(false)
  const adminDeliveryInvalidateKeys = useMemo(() => [
    ['admin-delivery-jobs'],
    ['admin-delivery-events'],
  ], [])
  const handleAdminIdle = useCallback(() => {
    const keepLive = window.confirm('Keep Delivery Event Viewer Live Mode connected?')
    setLiveMode(keepLive)
  }, [])
  const deliveryPolicy = useDeliveryTrackingPolicy({
    surface: 'admin-delivery',
    liveMode,
    invalidateQueryKeys: adminDeliveryInvalidateKeys,
    onAdminIdle: handleAdminIdle,
  })

  // Fetch delivery jobs
  const { data: deliveryJobsData, isLoading: isLoadingDeliveries, refetch: refetchDeliveries } = useQuery<DeliveryJobsResponse>({
    queryKey: ['admin-delivery-jobs', page, pageSize, statusFilter, providerFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(providerFilter !== 'all' && { provider: providerFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await authFetch<DeliveryJobsResponse>(`/api/admin/delivery/jobs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch delivery jobs')

      return await response.json()
    },
    refetchInterval: deliveryPolicy.pollIntervalMs,
  })

  // Fetch delivery events
  const { data: eventsData, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery<DeliveryEventsResponse>({
    queryKey: ['admin-delivery-events', page, pageSize, providerFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(providerFilter !== 'all' && { provider: providerFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await authFetch<DeliveryEventsResponse>(`/api/admin/delivery/events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch delivery events')

      return await response.json()
    },
    refetchInterval: deliveryPolicy.pollIntervalMs,
  })

  // Manual refresh mutation
  const refreshDeliveryStatusMutation = useMutation({
    mutationFn: async (deliveryJobId: string) => {
      const response = await fetch(`/api/delivery/jobs/${deliveryJobId}/refresh`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to refresh delivery status')
      
      return await response.json()
    },
    onSuccess: () => {
      refetchDeliveries()
    }
  })

  const deliveryJobs: DeliveryJob[] = deliveryJobsData?.deliveryJobs ?? []
  const deliveryEvents: DeliveryEvent[] = eventsData?.events ?? []
  const totalDeliveries = deliveryJobsData?.pagination?.total || 0
  const totalEvents = eventsData?.pagination?.total || 0

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'success'
      case 'canceled': return 'destructive'
      case 'failed': return 'destructive'
      case 'dispatched': return 'default'
      case 'out_for_delivery': return 'default'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'canceled': return <XCircle className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      case 'dispatched': return <Truck className="w-4 h-4" />
      case 'out_for_delivery': return <Package className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'dispatch_created': return 'success'
      case 'delivery_cancelled': return 'destructive'
      case 'provider_error': return 'destructive'
      case 'status_updated': return 'default'
      case 'location_updated': return 'default'
      default: return 'secondary'
    }
  }

  const formatPayload = (payload: unknown): string => {
    try {
      return JSON.stringify(payload, null, 2)
    } catch {
      return String(payload)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleExport = async () => {
    const csv =
      activeTab === 'deliveries'
        ? convertDeliveriesToCSV(deliveryJobs)
        : convertEventsToCSV(deliveryEvents)
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const convertDeliveriesToCSV = (deliveries: DeliveryJob[]) => {
    const headers = ['Order ID', 'Store ID', 'Provider', 'Status', 'Provider Status', 'Tracking URL', 'Created', 'Updated']
    const rows = deliveries.map(job => [
      job.order.id,
      job.order.storeId,
      job.provider,
      job.status,
      job.providerStatus,
      job.trackingUrl || '',
      job.createdAt,
      job.updatedAt
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const convertEventsToCSV = (events: DeliveryEvent[]) => {
    const headers = ['Event ID', 'Delivery Job ID', 'Provider', 'Event Type', 'Timestamp', 'Processed', 'Payload']
    const rows = events.map(event => [
      event.id,
      event.deliveryJobId,
      event.provider,
      event.eventType,
      event.timestamp,
      event.processed.toString(),
      formatPayload(event.payload)
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Delivery Event Viewer</h1>
        <p className="text-muted-foreground">
          Monitor delivery operations, events, and system performance
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by order ID, provider external ID, or tracking URL..."
                  value={searchTerm}
                  onChange={(e) => { deliveryPolicy.markMeaningfulInteraction(); setSearchTerm(e.target.value) }}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => { deliveryPolicy.markMeaningfulInteraction(); setStatusFilter(value) }}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={providerFilter} onValueChange={(value) => { deliveryPolicy.markMeaningfulInteraction(); setProviderFilter(value) }}>
                <SelectTrigger className="w-40">
                  <Truck className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="DOORDASH_DRIVE">DoorDash</SelectItem>
                  <SelectItem value="UBER_EATS">Uber Eats</SelectItem>
                  <SelectItem value="STORE_MANAGED">Store Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="small"
                onClick={() => {
                  deliveryPolicy.markMeaningfulInteraction()
                  return activeTab === 'deliveries' ? refetchDeliveries() : refetchEvents()
                }}
                disabled={activeTab === 'deliveries' ? isLoadingDeliveries : isLoadingEvents}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant={liveMode ? 'primary' : 'outline'}
                size="small"
                onClick={() => {
                  deliveryPolicy.markMeaningfulInteraction()
                  setLiveMode((value) => !value)
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                {liveMode
                  ? deliveryPolicy.isRealtimeConnected
                    ? 'Live On'
                    : 'Live Fallback'
                  : 'Live Mode'}
              </Button>

              <Button
                variant="outline"
                size="small"
                onClick={handleExport}
                disabled={deliveryJobs.length === 0 && deliveryEvents.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-4 border-b">
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'deliveries' 
                ? 'text-foreground border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('deliveries')}
          >
            Active Deliveries ({totalDeliveries})
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'events' 
                ? 'text-foreground border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('events')}
          >
            Provider Events ({totalEvents})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'deliveries' && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDeliveries ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : deliveryJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No delivery jobs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Order</th>
                      <th className="text-left p-3 font-medium">Store</th>
                      <th className="text-left p-3 font-medium">Provider</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Provider Status</th>
                      <th className="text-left p-3 font-medium">Last Event</th>
                      <th className="text-left p-3 font-medium">Tracking URL</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Updated</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryJobs.map((job) => (
                      <tr key={job.id} className="border-b hover:bg-muted/25" onClick={() => deliveryPolicy.markMeaningfulInteraction()}>
                        <td className="p-3">
                          <div className="font-mono text-sm">{job.order.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPriceCurrency(job.order.total)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-sm">{job.order.storeId.slice(0, 8).toUpperCase()}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {job.provider.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusColor(job.status)} className="text-xs">
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusColor(job.providerStatus)} className="text-xs">
                            {job.providerStatus.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {getStatusIcon(job.providerStatus)}
                        </td>
                        <td className="p-3">
                          {job.trackingUrl && (
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => { deliveryPolicy.markMeaningfulInteraction(); window.open(job.trackingUrl, '_blank') }}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Track
                            </Button>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(job.updatedAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => { deliveryPolicy.markMeaningfulInteraction(); refreshDeliveryStatusMutation.mutate(job.id) }}
                              disabled={refreshDeliveryStatusMutation.isPending}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => { deliveryPolicy.markMeaningfulInteraction(); window.open(`/orders/${job.order.id}`, '_blank') }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalDeliveries > pageSize && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(totalDeliveries / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPage(Math.min(Math.ceil(totalDeliveries / pageSize), page + 1))}
                  disabled={page >= Math.ceil(totalDeliveries / pageSize)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : deliveryEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No delivery events found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveryEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getEventTypeColor(event.eventType)} className="text-xs">
                          {event.eventType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.provider.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-mono mb-2">{event.deliveryJobId.slice(0, 8).toUpperCase()}</div>
                      <div className="bg-muted/50 rounded p-2 font-mono text-xs overflow-x-auto">
                        <pre>{formatPayload(event.payload)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalEvents > pageSize && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(totalEvents / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPage(Math.min(Math.ceil(totalEvents / pageSize), page + 1))}
                  disabled={page >= Math.ceil(totalEvents / pageSize)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
