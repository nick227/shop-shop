import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle, ShieldCheck, ShieldOff, Shield } from 'lucide-react'

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

const ALL_ROLES = ['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF']

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="small" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="small" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [pendingAction, setPendingAction] = useState<{ type: 'role' | 'suspend'; payload: unknown } | null>(null)
  const [selectedRole, setSelectedRole] = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/users/${userId}`, { headers })
      if (!res.ok) throw new Error('Failed to load user')
      return res.json()
    },
  })

  useEffect(() => {
    if (user) setSelectedRole(user.role)
  }, [user])

  const roleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await fetch(`${apiBase}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setPendingAction(null)
    },
    onError: (e: Error) => { toast.error(e.message); setPendingAction(null) },
  })

  const suspendMutation = useMutation({
    mutationFn: async (suspend: boolean) => {
      const res = await fetch(`${apiBase}/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ suspend }),
      })
      if (!res.ok) throw new Error('Failed to update suspension')
      return res.json()
    },
    onSuccess: (_, suspend) => {
      toast.success(suspend ? 'User suspended' : 'User unsuspended')
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setPendingAction(null)
    },
    onError: (e: Error) => { toast.error(e.message); setPendingAction(null) },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  if (!user) {
    return <div className="p-6 text-sm text-muted-foreground">User not found.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {pendingAction && (
        <ConfirmDialog
          message={
            pendingAction.type === 'role'
              ? `Change this user's role to ${pendingAction.payload}?`
              : (pendingAction.payload ? 'Suspend this user? They will lose access.' : 'Unsuspend this user?')
          }
          onConfirm={() => {
            if (pendingAction.type === 'role') roleMutation.mutate(pendingAction.payload as string)
            else suspendMutation.mutate(pendingAction.payload as boolean)
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}

      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      {/* Account status banner */}
      {user.suspendedAt ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <ShieldOff className="h-4 w-4 shrink-0" />
          <span>
            <strong>Account suspended</strong> since {new Date(user.suspendedAt).toLocaleDateString()}.
            This user cannot log in or use their existing sessions.
          </span>
        </div>
      ) : user.role === 'ADMIN' ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Shield className="h-4 w-4 shrink-0" />
          <span>
            <strong>Admin-protected account.</strong> Admins cannot be suspended and cannot be demoted if they are the last admin.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span><strong>Account active.</strong> Full access enabled.</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">{user.name ?? user.email}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Account Info</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant={ROLE_COLORS[user.role] ?? 'outline'}>{user.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span className="tabular-nums">{user._count?.orders ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stores</span>
                <span className="tabular-nums">{user._count?.storesOwned ?? 0}</span>
              </div>
              {user.suspendedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="text-destructive">{new Date(user.suspendedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Actions</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Change Role</label>
                <div className="flex gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setPendingAction({ type: 'role', payload: selectedRole })}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {user.role === 'ADMIN' ? (
                <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Admin accounts cannot be suspended.
                </div>
              ) : user.suspendedAt ? (
                <Button
                  size="small"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPendingAction({ type: 'suspend', payload: false })}
                >
                  Unsuspend Account
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="danger"
                  className="w-full"
                  onClick={() => setPendingAction({ type: 'suspend', payload: true })}
                >
                  Suspend Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
