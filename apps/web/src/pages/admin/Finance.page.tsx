import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives'
import { Badge } from '@shared/ui/primitives'
import { Alert } from '@shared/ui/primitives'
import { useAuthStore } from '@stores/authStore'
import { formatCurrency } from '@shared/lib/utils/format'

interface FinanceOverview {
  payments: {
    ordersToday: number
    paidOrdersToday: number
    failedPaymentsToday: number
    failureRate: number
    stuckPendingPayment: number
  }
  stripe: {
    totalStores: number
    connectedStores: number
    chargesEnabledStores: number
    missingStripeStores: number
    onboardingIncompleteStores: number
  }
  refunds: {
    refundsToday: number
    refundedCentsToday: number
    pendingRefunds: number
    delayedRefunds: number
  }
  payouts: {
    pendingVendorPayouts: number
    pendingVendorPayoutCents: number
    delayedPayouts: number
  }
  revenue: {
    platformFeesTodayCents: number
    platformFeesWeekCents: number
    platformFeesAllTimeCents: number
    affiliateCommissionsPendingCents: number
  }
  alerts: Array<{
    type: string
    severity: 'info' | 'warning' | 'critical'
    label: string
    value: string | number
  }>
}

export default function FinancePage() {
  const { token } = useAuthStore()
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFinanceOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/admin/finance/overview', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch finance overview: ${response.statusText}`)
        }

        const data = await response.json()
        setOverview(data)
      } catch (err) {
        console.error('Error fetching finance overview:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchFinanceOverview()
  }, [token])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'default'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-muted-foreground">
          No finance data available
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Finance Overview</h1>
        <Badge variant="outline">Read-only</Badge>
      </div>

      {/* Alerts */}
      {overview.alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Active Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.alerts.map((alert, index) => (
              <Alert key={index} variant={getSeverityColor(alert.severity) as any}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.label}</span>
                  <span className="font-bold">{alert.value}</span>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Payment Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Orders Today:</span>
              <span className="font-semibold">{overview.payments.ordersToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid Orders:</span>
              <span className="font-semibold text-green-600">{overview.payments.paidOrdersToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Canceled / Unpaid:</span>
              <span className="font-semibold text-red-600">{overview.payments.failedPaymentsToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Attention Rate:</span>
              <span className={`font-semibold ${overview.payments.failureRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.payments.failureRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stuck Payments:</span>
              <span className={`font-semibold ${overview.payments.stuckPendingPayment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.payments.stuckPendingPayment}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stripe Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Total Stores:</span>
              <span className="font-semibold">{overview.stripe.totalStores.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Connected:</span>
              <span className="font-semibold text-green-600">{overview.stripe.connectedStores.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Charges Enabled:</span>
              <span className="font-semibold text-green-600">{overview.stripe.chargesEnabledStores.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Missing Stripe:</span>
              <span className={`font-semibold ${overview.stripe.missingStripeStores > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.stripe.missingStripeStores}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Onboarding Incomplete:</span>
              <span className={`font-semibold ${overview.stripe.onboardingIncompleteStores > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.stripe.onboardingIncompleteStores}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Refunds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Refunds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Refunds Today:</span>
              <span className="font-semibold">{overview.refunds.refundsToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Refunded Amount:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(overview.refunds.refundedCentsToday / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pending Review:</span>
              <span className={`font-semibold ${overview.refunds.pendingRefunds > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {overview.refunds.pendingRefunds}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delayed &gt; 24h:</span>
              <span className={`font-semibold ${overview.refunds.delayedRefunds > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.refunds.delayedRefunds}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Pending Payouts:</span>
              <span className="font-semibold">{overview.payouts.pendingVendorPayouts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Amount:</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(overview.payouts.pendingVendorPayoutCents / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delayed &gt; 48h:</span>
              <span className={`font-semibold ${overview.payouts.delayedPayouts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.payouts.delayedPayouts}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Platform Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Fees Today:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(overview.revenue.platformFeesTodayCents / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fees This Week:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(overview.revenue.platformFeesWeekCents / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>All-time Fees:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(overview.revenue.platformFeesAllTimeCents / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Affiliate Commissions Pending:</span>
              <span className="font-semibold text-yellow-600">
                {formatCurrency(overview.revenue.affiliateCommissionsPendingCents / 100)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stuck Payment Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Stuck Payment Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Orders stuck &gt; 30 min:</span>
                <span className="font-semibold text-red-600">
                  {overview.payments.stuckPendingPayment}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Orders that have been in PENDING_PAYMENT status for more than 30 minutes.
                  These may indicate payment processing issues that need attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Missing Stripe */}
      <Card>
        <CardHeader>
          <CardTitle>Stores Missing Stripe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Stores without Stripe:</span>
              <span className="font-semibold text-red-600">
                {overview.stripe.missingStripeStores}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Onboarding incomplete:</span>
              <span className="font-semibold text-yellow-600">
                {overview.stripe.onboardingIncompleteStores}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
