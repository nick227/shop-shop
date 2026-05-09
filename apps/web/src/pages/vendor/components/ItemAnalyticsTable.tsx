import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Package,
  DollarSign,
  ShoppingCart,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Badge } from '@shared/ui/primitives/ui/Badge/Badge'
import { Button } from '@shared/ui/primitives'
import { formatCurrency, formatRelativeTime } from '@shared/lib/utils/format'
import { Skeleton } from '@shared/ui/primitives/ui/Skeleton/Skeleton'
import { authGet } from '@shared/lib/auth/authFetch'

interface ItemAnalytics {
  itemId: string
  title: string
  description: string | null
  price: number
  imageUrl: string | null
  isActive: boolean
  isSoldOut: boolean
  unitsSold: number
  revenue: number
  orderCount: number
  lastSale: string | null
  avgOrderValue: number
  periodUnitsSold: number
  periodRevenue: number
  periodOrderCount: number
  trend: 'up' | 'down' | 'stable'
}

interface ItemAnalyticsTableProps {
  storeId: string
  onEditItem?: (itemId: string) => void
  onDeleteItem?: (itemId: string, title: string) => void
}

type SortField = 'revenue' | 'unitsSold' | 'orders' | 'lastSale' | 'title' | 'price'
type SortOrder = 'asc' | 'desc'
type Period = '7d' | '30d' | '90d' | 'all'

export function ItemAnalyticsTable({ storeId, onEditItem, onDeleteItem }: ItemAnalyticsTableProps) {
  const [sortField, setSortField] = useState<SortField>('revenue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [period, setPeriod] = useState<Period>('30d')

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['item-analytics', storeId, period, sortField, sortOrder],
    queryFn: async () => {
      const qs = new URLSearchParams({
        storeId,
        period,
        sortBy: sortField,
        sortOrder,
        limit: '100',
      })
      const response = await authGet(`/api/items/analytics?${qs.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds for near-real-time updates
  })

  const items = useMemo(() => {
    if (!analyticsData?.data?.items) return []
    return analyticsData.data.items as ItemAnalytics[]
  }, [analyticsData])

  const summary = useMemo(() => {
    if (!analyticsData?.data?.summary) return null
    return analyticsData.data.summary
  }, [analyticsData])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    )
  }

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load analytics data. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Period Selector & Summary Stats */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'outline'}
              size="small"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p === 'all' ? 'All Time' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>

        {summary && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{summary.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
              <div className="text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{summary.totalUnitsSold}</div>
              <div className="text-muted-foreground">Units Sold</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{summary.totalOrders}</div>
              <div className="text-muted-foreground">Orders</div>
            </div>
          </div>
        )}
      </div>

      {/* Dense Analytics Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-sm">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleSort('title')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Item
                    {renderSortIcon('title')}
                  </Button>
                </th>
                <th className="text-right p-3 font-medium text-sm">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleSort('price')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Price
                    {renderSortIcon('price')}
                  </Button>
                </th>
                <th className="text-right p-3 font-medium text-sm">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleSort('unitsSold')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Units
                    {renderSortIcon('unitsSold')}
                  </Button>
                </th>
                <th className="text-right p-3 font-medium text-sm">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleSort('revenue')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Revenue
                    {renderSortIcon('revenue')}
                  </Button>
                </th>
                <th className="text-right p-3 font-medium text-sm">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleSort('orders')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Orders
                    {renderSortIcon('orders')}
                  </Button>
                </th>
                <th className="text-right p-3 font-medium text-sm">Avg/Order</th>
                <th className="text-center p-3 font-medium text-sm">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleSort('lastSale')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Last Sale
                    {renderSortIcon('lastSale')}
                  </Button>
                </th>
                <th className="text-center p-3 font-medium text-sm">Trend</th>
                <th className="text-center p-3 font-medium text-sm">Status</th>
                <th className="p-3 font-medium text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="p-3 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Skeleton className="h-6 w-16 mx-auto" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-6 w-20 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted-foreground">
                    No items found for the selected period.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.itemId} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="p-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        {item.periodUnitsSold.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {formatCurrency(item.periodRevenue)}
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                        {item.periodOrderCount}
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm">
                      {formatCurrency(item.avgOrderValue)}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {item.lastSale ? (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>{formatRelativeTime(new Date(item.lastSale))}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {renderTrendIcon(item.trend)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          item.isActive && !item.isSoldOut
                            ? 'success'
                            : item.isSoldOut
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {item.isActive && !item.isSoldOut
                          ? 'Active'
                          : item.isSoldOut
                          ? 'Sold Out'
                          : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        {onEditItem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditItem(item.itemId)}
                            className="h-6 w-6"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteItem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteItem(item.itemId, item.title)}
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && items.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Showing {items.length} items • Data refreshes every 30 seconds
        </div>
      )}
    </div>
  )
}
