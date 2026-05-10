import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Users } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

const ROLE_COLORS: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary'> = {
  ADMIN: 'destructive',
  VENDOR: 'success',
  VENDOR_PENDING: 'warning',
  AFFILIATE: 'secondary',
  USER: 'outline',
  RIDER: 'default',
  STAFF: 'default',
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  suspendedAt: string | null
  createdAt: string
  _count: { orders: number; storesOwned: number }
}

export default function AdminUsersPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      params.set('page', String(page))
      const res = await fetch(`${apiBase}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load users')
      return res.json() as Promise<{ users: AdminUser[]; total: number; pages: number }>
    },
  })

  const users = data?.users ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">All platform accounts</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm w-60"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="VENDOR">Vendor</option>
          <option value="VENDOR_PENDING">Vendor Pending</option>
          <option value="ADMIN">Admin</option>
          <option value="AFFILIATE">Affiliate</option>
          <option value="RIDER">Rider</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="px-4 py-3">Name / Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Orders</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Stores</th>
                  <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors ${u.suspendedAt ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/30'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.name ?? '—'}</span>
                        {u.suspendedAt && (
                          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_COLORS[u.role] ?? 'outline'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell tabular-nums">{u._count.orders}</td>
                    <td className="px-4 py-3 hidden sm:table-cell tabular-nums">{u._count.storesOwned}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="small" variant="outline" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data?.pages}
              </span>
              <div className="flex gap-2">
                <Button size="small" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button size="small" variant="outline" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)}>
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
