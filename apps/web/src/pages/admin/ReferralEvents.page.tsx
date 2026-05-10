import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button, Input } from '@shared/ui/primitives'
import { ArrowLeft, Filter, Download } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function fmtDate(s: string | null | undefined) {
  return s ? new Date(s).toLocaleDateString() : '—'
}

const EVENT_TYPE_COLOR: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  STORE_SIGNUP: 'success',
  USER_SIGNUP: 'secondary',
}

export default function AdminReferralEventsPage() {
  const token = useAuthStore((s) => s.token)
  const apiBase = getApiBase()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [eventType, setEventType] = useState('')
  const [limit, setLimit] = useState('50')
  const [offset, setOffset] = useState('0')

  const eventsQuery = useQuery({
    queryKey: ['admin-referral-events', eventType, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (eventType) params.set('eventType', eventType)
      if (limit) params.set('limit', limit)
      if (offset) params.set('offset', offset)
      
      const res = await fetch(`${apiBase}/api/referral-events?${params.toString()}`, { headers })
      if (!res.ok) throw new Error('Failed to load referral events')
      return res.json() as Promise<{ events: Record<string, unknown>[]; total: number }>
    },
  })

  const events = eventsQuery.data?.events ?? []
  const total = eventsQuery.data?.total ?? 0

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export functionality to be implemented')
  }

  const handlePageChange = (newOffset: number) => {
    setOffset(String(newOffset))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referral Events</h1>
        <Button onClick={handleExport} variant="outline" size="small" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">All Types</option>
                <option value="STORE_SIGNUP">Store Signup</option>
                <option value="USER_SIGNUP">User Signup</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Referral Events {total > 0 && `(${total} total)`}
          </p>
          {eventsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Spinner size="large" /></div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referral events found.</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Affiliate</th>
                      <th className="px-3 py-2">Target</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2 hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {events.map((event) => (
                      <tr key={event.id as string} className="hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <Badge variant={EVENT_TYPE_COLOR[event.eventType as string] ?? 'outline'}>
                            {event.eventType as string}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{(event.affiliate as any)?.user?.name || (event.affiliate as any)?.user?.email}</div>
                          <div className="text-xs text-muted-foreground font-mono">{(event.affiliate as any)?.referralCode}</div>
                        </td>
                        <td className="px-3 py-2">
                          {event.referredStore ? (
                            <div>
                              <div className="font-medium">{(event.referredStore as any).name}</div>
                              <div className="text-xs text-muted-foreground">Store</div>
                            </div>
                          ) : event.referredUser ? (
                            <div>
                              <div className="font-medium">{(event.referredUser as any)?.name || (event.referredUser as any)?.email}</div>
                              <div className="text-xs text-muted-foreground">User</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{event.referralCode as string}</td>
                        <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">
                          {fmtDate(event.createdAt as string)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > Number(limit) && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(Number(offset) + 1, total)}-{Math.min(Number(offset) + Number(limit), total)} of {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handlePageChange(Math.max(0, Number(offset) - Number(limit)))}
                      disabled={Number(offset) === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handlePageChange(Number(offset) + Number(limit))}
                      disabled={Number(offset) + Number(limit) >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
