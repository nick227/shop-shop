import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { useVendorStores, useVendorTeamRequest } from '@shared/hooks/hooks/vendor'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { formatPriceCurrency, formatDateShort } from '@shared/lib/utils/format'
import { Users } from 'lucide-react'

type AffiliateSalesSummary = {
  revenue: number
  orders: number
  customers: number
  averageOrderValue: number
}

type AffiliateSalesRow = {
  affiliateId: string
  affiliateName: string
  referralCode: string
  website?: string | null
  orders: number
  revenue: number
  customers: number
  averageOrderValue: number
  lastOrderAt: string | null
}

type AffiliateRecentOrder = {
  orderId: string
  customerName?: string | null
  total: number
  affiliateName: string
  referralCode: string
  createdAt: string
  status: string
}

type AffiliateSalesResponse = {
  summary: AffiliateSalesSummary
  rows: AffiliateSalesRow[]
  recentOrders: AffiliateRecentOrder[]
}

function metricLabel(n: number, singular: string, plural = `${singular}s`) {
  return n === 1 ? singular : plural
}

export default function VendorAffiliatesPage() {
  const vendorRequest = useVendorTeamRequest()
  const { data: stores = [], isLoading: storesLoading } = useVendorStores()
  const { selectedStoreId } = useVendorActiveStore()

  const salesQuery = useQuery({
    queryKey: ['affiliate-sales', selectedStoreId],
    queryFn: async () =>
      vendorRequest<AffiliateSalesResponse>(`/stores/${selectedStoreId}/affiliate-sales`),
    enabled: Boolean(selectedStoreId),
  })

  const summary = salesQuery.data?.summary
  const topAffiliates = salesQuery.data?.rows ?? []
  const recentOrders = salesQuery.data?.recentOrders ?? []

  const hasSales = Boolean(summary && summary.orders > 0)
  const storeName = useMemo(() => stores.find((s) => s.id === selectedStoreId)?.name ?? 'Store', [stores, selectedStoreId])

  if (storesLoading) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6">
        <div className="flex min-h-[360px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  if (!stores.length) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6">
        <EmptyState icon={Users} title="Create a store first" description="Affiliate sales are tracked per store." />
      </PageShell>
    )
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6">
      <PageHeader
        title="Affiliate Sales"
        description="See orders, revenue, and customers brought to this store through Shop-shop affiliates. Switch the active store from the header."
      />

      {salesQuery.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : salesQuery.error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            {salesQuery.error instanceof Error ? salesQuery.error.message : 'Failed to load affiliate sales.'}
          </CardContent>
        </Card>
      ) : !hasSales ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-lg font-semibold mb-2">No affiliate-driven sales yet.</div>
            <div className="text-sm text-muted-foreground">
              When Shop-shop affiliates send customers who order from this store, their sales impact will appear here.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="text-2xl font-bold tracking-tight mb-0.5">{formatPriceCurrency(summary!.revenue)}</div>
                <div className="text-label">Revenue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="text-2xl font-bold tracking-tight mb-0.5">{summary!.orders}</div>
                <div className="text-label">{metricLabel(summary!.orders, 'Order')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="text-2xl font-bold tracking-tight mb-0.5">{summary!.customers}</div>
                <div className="text-label">{metricLabel(summary!.customers, 'Customer')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="text-2xl font-bold tracking-tight mb-0.5">{formatPriceCurrency(summary!.averageOrderValue)}</div>
                <div className="text-label">Avg order value</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top affiliates</CardTitle>
              <div className="text-sm text-muted-foreground">Affiliate-driven orders for {storeName}.</div>
            </CardHeader>
            <CardContent className="space-y-2">
              {topAffiliates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No affiliates yet.</p>
              ) : (
                topAffiliates.map((row) => (
                  <div key={row.affiliateId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{row.affiliateName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Code <span className="font-mono">{row.referralCode}</span>
                        {row.website ? <> · {row.website}</> : null}
                      </div>
                      {row.lastOrderAt ? (
                        <div className="text-xs text-muted-foreground">Last order {formatDateShort(row.lastOrderAt)}</div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{row.orders} {metricLabel(row.orders, 'order')}</Badge>
                      <Badge variant="outline">{formatPriceCurrency(row.revenue)} revenue</Badge>
                      <Badge variant="outline">{row.customers} {metricLabel(row.customers, 'customer')}</Badge>
                      <Badge variant="outline">{formatPriceCurrency(row.averageOrderValue)} AOV</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent affiliate-driven orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No affiliate-driven orders yet.</p>
              ) : (
                recentOrders.map((o) => (
                  <div key={o.orderId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">Order #{o.orderId.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {o.customerName ?? 'Customer'} · {formatDateShort(o.createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {o.affiliateName} · <span className="font-mono">{o.referralCode}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{o.status}</Badge>
                      <Badge variant="default">{formatPriceCurrency(o.total)}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}

