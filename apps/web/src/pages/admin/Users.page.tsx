import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { CheckSquare, Square, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { BulkDeleteConfirmDialog } from './components/BulkDeleteConfirmDialog'

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

function userRowSelectable(u: AdminUser, currentUserId: string | undefined): boolean {
  if (!currentUserId || u.id === currentUserId) return false
  if (u._count.orders > 0 || u._count.storesOwned > 0) return false
  return true
}

export default function AdminUsersPage() {
  const token = useAuthStore((s) => s.token)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [showBulkDialog, setShowBulkDialog] = useState(false)

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
    enabled: Boolean(token),
  })

  const bulkDelete = useMutation({
    mutationFn: async ({ userIds, reason }: { userIds: string[]; reason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/users/bulk`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, reason }),
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Failed to delete users')
      return body as { deletedCount: number }
    },
    onSuccess: (r) => {
      toast.success(`Deleted ${r.deletedCount} user(s)`)
      setSelectedIds(new Set())
      setShowBulkDialog(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setShowBulkDialog(false)
    },
  })

  const users = data?.users ?? []
  const selectableOnPage = users.filter((u) => userRowSelectable(u, currentUserId))
  const selectedUsers = users.filter((u) => selectedIds.has(u.id))

  const handleSelectAll = () => {
    if (selectedIds.size === selectableOnPage.length && selectableOnPage.length > 0) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(selectableOnPage.map((u) => u.id)))
  }

  const toggleUser = (u: AdminUser) => {
    if (!userRowSelectable(u, currentUserId)) return
    const next = new Set(selectedIds)
    if (next.has(u.id)) next.delete(u.id)
    else next.add(u.id)
    setSelectedIds(next)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      {showBulkDialog && (
        <BulkDeleteConfirmDialog
          entityLabel="user accounts"
          count={selectedIds.size}
          previewLines={selectedUsers.map((u) => `${u.email} · ${u.role}`)}
          isDeleting={bulkDelete.isPending}
          onCancel={() => setShowBulkDialog(false)}
          onConfirm={(reason) => bulkDelete.mutate({ userIds: [...selectedIds], reason })}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">All platform accounts</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm w-60"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); setSelectedIds(new Set()) }}
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

        {selectableOnPage.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {selectedIds.size === selectableOnPage.length ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedIds.size === selectableOnPage.length ? 'Deselect all (page)' : 'Select all (page)'}
          </button>
        )}

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
            <Button
              variant="danger"
              size="small"
              className="gap-2"
              onClick={() => setShowBulkDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </Button>
          </div>
        )}
      </div>

      {!token ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : isLoading ? (
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
                  <th className="px-4 py-3 w-10" aria-label="Select" />
                  <th className="px-4 py-3">Name / Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Orders</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Stores</th>
                  <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const selectable = userRowSelectable(u, currentUserId)
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${u.suspendedAt ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={!selectable}
                          onClick={() => toggleUser(u)}
                          className={selectable ? 'flex items-center justify-center' : 'opacity-30 cursor-not-allowed'}
                          aria-label={selectable ? 'Select row' : 'Cannot select'}
                        >
                          {selectedIds.has(u.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
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
                  )
                })}
              </tbody>
            </table>
          </div>

          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data?.pages}
              </span>
              <div className="flex gap-2">
                <Button size="small" variant="outline" disabled={page === 1} onClick={() => { setPage((p) => p - 1); setSelectedIds(new Set()) }}>
                  Previous
                </Button>
                <Button size="small" variant="outline" disabled={page === data?.pages} onClick={() => { setPage((p) => p + 1); setSelectedIds(new Set()) }}>
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
