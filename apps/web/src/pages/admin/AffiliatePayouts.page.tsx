import { useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Banknote } from 'lucide-react'
import { toast } from 'sonner'

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function formatCurrency(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0)
  return '$' + v.toFixed(2)
}

function formatDate(s: string | undefined | null): string {
  if (!s) return '-'
  return new Date(s).toLocaleDateString()
}

const statusColor: Record<
  string,
  'default' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary'
> = {
  PENDING: 'warning',
  PROCESSING: 'secondary',
  COMPLETED: 'success',
  FAILED: 'destructive',
}

export default function AdminAffiliatePayoutsPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')

  const apiBase = getApiBase()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const listQuery = useQuery({
    queryKey: ['admin-payouts', status],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates?limit=100`, { headers })
      if (!res.ok) throw new Error('Failed to load')
      const data = (await res.json()) as { affiliates: Record<string, unknown>[] }
      return data.affiliates
    },
  })

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-6xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader title="Affiliate Payouts" description="View and manage affiliate payouts." />

      {listQuery.isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Use the <strong>Affiliates</strong> list to select an affiliate and process payouts from
          their detail page.
        </p>
      )}
    </PageShell>
  )
}
