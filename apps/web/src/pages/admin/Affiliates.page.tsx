import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { UserCheck } from 'lucide-react'
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
  ACTIVE: 'success',
  SUSPENDED: 'destructive',
  TERMINATED: 'destructive',
}

export default function AdminAffiliatesPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')

  const apiBase = getApiBase()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const listQuery = useQuery({
    queryKey: ['admin-affiliates', filterStatus],
    queryFn: async () => {
      const q = filterStatus ? `?status=${filterStatus}` : ''
      const res = await fetch(`${apiBase}/api/affiliates${q}`, { headers })
      if (!res.ok) throw new Error('Failed to load affiliates')
      return res.json() as Promise<{ affiliates: Record<string, unknown>[]; total: number }>
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${apiBase}/api/affiliates/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Affiliate status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const affiliates = listQuery.data?.affiliates ?? []

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-6xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader title="Affiliates" description="Monitor affiliates and manage account status." />

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending (legacy)</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {listQuery.isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : affiliates.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No affiliates found"
          description="No affiliates match the current filter."
        />
      ) : (
        <div className="space-y-2">
          {affiliates.map((a) => {
            const user = a.user as Record<string, unknown> | undefined
            const counts = a._count as Record<string, unknown> | undefined
            return (
              <Card key={a.id as string}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {(user?.name as string) ?? (user?.email as string)}
                      </span>
                      <Badge variant={statusColor[(a.status as string) ?? ''] ?? 'outline'}>
                        {a.status as string}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.email as string}
                      {' · '}Code: <span className="font-mono">{a.referralCode as string}</span>
                      {' · '}Since {formatDate(a.createdAt as string)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(counts?.referredStores as number) ?? 0} stores
                      {' · '}
                      {(counts?.commissions as number) ?? 0} commissions
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === 'PENDING' && (
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: a.id as string, status: 'ACTIVE' })
                        }
                      >
                        Activate
                      </Button>
                    )}
                    {a.status === 'ACTIVE' && (
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: a.id as string, status: 'SUSPENDED' })
                        }
                      >
                        Suspend
                      </Button>
                    )}
                    {a.status === 'SUSPENDED' && (
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: a.id as string, status: 'ACTIVE' })
                        }
                      >
                        Reactivate
                      </Button>
                    )}
                    {a.status !== 'TERMINATED' && (
                      <Button
                        size="small"
                        variant="destructive"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: a.id as string, status: 'TERMINATED' })
                        }
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
