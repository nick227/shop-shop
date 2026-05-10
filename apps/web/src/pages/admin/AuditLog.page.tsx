import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Spinner, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface AuditLogEntry {
  id: string
  action: string
  targetType: string
  targetId: string | null
  payload: unknown
  createdAt: string
  admin: { id: string; name: string | null; email: string }
}

interface FilterOptions {
  actions: string[]
  admins: { id: string; name: string | null; email: string }[]
}

function PayloadRow({ payload }: { payload: unknown }) {
  const [open, setOpen] = useState(false)
  if (!payload) return null
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Hide' : 'Show'} payload
      </button>
      {open && (
        <pre className="mt-1 overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function AdminAuditLogPage() {
  const token = useAuthStore((s) => s.token)
  const apiBase = getApiBase()
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page, actionFilter, adminFilter, from, to],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (actionFilter) params.set('action', actionFilter)
      if (adminFilter) params.set('adminId', adminFilter)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${apiBase}/api/admin/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load audit log')
      return res.json() as Promise<{
        logs: AuditLogEntry[]
        total: number
        pages: number
        filterOptions: FilterOptions
      }>
    },
  })

  const logs = data?.logs ?? []
  const filterOptions = data?.filterOptions

  function resetFilters() {
    setActionFilter('')
    setAdminFilter('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const hasFilters = actionFilter || adminFilter || from || to

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">All admin actions, newest first</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All actions</option>
          {filterOptions?.actions.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          value={adminFilter}
          onChange={(e) => { setAdminFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All admins</option>
          {filterOptions?.admins.map((a) => (
            <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          title="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          title="To date"
        />

        {hasFilters && (
          <Button size="small" variant="outline" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={FileText} title="No audit entries" description="No actions match the current filters." />
      ) : (
        <>
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-primary">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.targetType && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {log.targetType}
                        {log.targetId && (
                          <span className="ml-1 font-mono opacity-60">
                            {log.targetId.slice(0, 8)}…
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{log.admin.name ?? log.admin.email}</div>
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <PayloadRow payload={log.payload} />
              </div>
            ))}
          </div>

          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data?.pages} · {data?.total} entries
              </span>
              <div className="flex gap-2">
                <Button size="small" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="small" variant="outline" disabled={page === data?.pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
