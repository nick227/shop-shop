import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Spinner, Badge, Button } from '@shared/ui/primitives'
import { useConfirm } from '@shared/ui/primitives/ui/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Layers } from 'lucide-react'
import { toast } from 'sonner'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function bpsToDisplay(bps: number) {
  return (bps / 100).toFixed(2)
}

function parsePctToBps(pct: string): number | null {
  const n = parseFloat(pct)
  if (isNaN(n) || n < 0 || n > 100) return null
  return Math.round(n * 100)
}

interface PayoutGroup {
  id: string
  name: string
  customerRateBps: number
  storeRateBps: number
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

interface GroupFormState {
  name: string
  customerPct: string
  storePct: string
}

const EMPTY_FORM: GroupFormState = { name: '', customerPct: '5.00', storePct: '5.00' }

export default function AdminPayoutGroupsPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const { confirm, dialog: confirmDialog } = useConfirm()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GroupFormState>(EMPTY_FORM)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<GroupFormState>(EMPTY_FORM)

  const { data: groups = [], isLoading } = useQuery<PayoutGroup[]>({
    queryKey: ['admin-payout-groups'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/v1/admin/payout-groups`, { headers })
      if (!res.ok) throw new Error('Failed to load payout groups')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (body: { name: string; customerRateBps: number; storeRateBps: number }) => {
      const res = await fetch(`${apiBase}/api/v1/admin/payout-groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to create group')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-groups'] })
      setShowCreate(false)
      setCreateForm(EMPTY_FORM)
      toast.success('Payout group created')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: { name?: string; customerRateBps?: number; storeRateBps?: number }
    }) => {
      const res = await fetch(`${apiBase}/api/v1/admin/payout-groups/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to update group')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-groups'] })
      setEditingId(null)
      toast.success('Payout group updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBase}/api/v1/admin/payout-groups/${id}/deactivate`, {
        method: 'POST',
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to deactivate group')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-groups'] })
      toast.success('Payout group deactivated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function startEdit(g: PayoutGroup) {
    setEditingId(g.id)
    setEditForm({
      name: g.name,
      customerPct: bpsToDisplay(g.customerRateBps),
      storePct: bpsToDisplay(g.storeRateBps),
    })
  }

  function commitEdit(id: string) {
    const customerRateBps = parsePctToBps(editForm.customerPct)
    const storeRateBps = parsePctToBps(editForm.storePct)
    if (customerRateBps === null || storeRateBps === null) {
      toast.error('Rates must be between 0% and 100%')
      return
    }
    if (!editForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    updateMutation.mutate({
      id,
      body: { name: editForm.name.trim(), customerRateBps, storeRateBps },
    })
  }

  function submitCreate() {
    const customerRateBps = parsePctToBps(createForm.customerPct)
    const storeRateBps = parsePctToBps(createForm.storePct)
    if (customerRateBps === null || storeRateBps === null) {
      toast.error('Rates must be between 0% and 100%')
      return
    }
    if (!createForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    createMutation.mutate({ name: createForm.name.trim(), customerRateBps, storeRateBps })
  }

  async function handleDeactivate(g: PayoutGroup) {
    const ok = await confirm({
      title: 'Deactivate payout group?',
      description: `Affiliates assigned to "${g.name}" will fall back to platform defaults unless they have a personal rate override.`,
      confirmLabel: 'Deactivate',
      variant: 'destructive',
    })
    if (ok) deactivateMutation.mutate(g.id)
  }

  return (
    <div className="space-y-6 p-6">
      {confirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payout Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Groups define shared customer and store referral rates for batches of affiliates.
          </p>
        </div>
        {!showCreate && (
          <Button size="sm" onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM) }}>
            New Group
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">New Payout Group</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Influencer Tier"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Customer referral %</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.25}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 pr-7 text-sm"
                  value={createForm.customerPct}
                  onChange={(e) => setCreateForm((f) => ({ ...f, customerPct: e.target.value }))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Store referral %</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.25}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 pr-7 text-sm"
                  value={createForm.storePct}
                  onChange={(e) => setCreateForm((f) => ({ ...f, storePct: e.target.value }))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={submitCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Spinner className="mr-1 h-3 w-3" /> : null}
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8 text-muted-foreground" />}
          title="No payout groups"
          description="Create a group to apply shared rates to multiple affiliates."
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-right font-medium">Customer %</th>
                <th className="px-4 py-2.5 text-right font-medium">Store %</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.id} className="bg-card hover:bg-muted/20">
                  {editingId === g.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.25}
                            className="w-20 rounded-md border border-input bg-background px-2 py-1 pr-6 text-right text-sm"
                            value={editForm.customerPct}
                            onChange={(e) => setEditForm((f) => ({ ...f, customerPct: e.target.value }))}
                          />
                          <span className="absolute right-2 text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.25}
                            className="w-20 rounded-md border border-input bg-background px-2 py-1 pr-6 text-right text-sm"
                            value={editForm.storePct}
                            onChange={(e) => setEditForm((f) => ({ ...f, storePct: e.target.value }))}
                          />
                          <span className="absolute right-2 text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {g.isDefault && <Badge variant="secondary">Default</Badge>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => commitEdit(g.id)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? <Spinner className="mr-1 h-3 w-3" /> : null}
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {bpsToDisplay(g.customerRateBps)}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {bpsToDisplay(g.storeRateBps)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {g.isDefault && <Badge variant="secondary">Default</Badge>}
                          <Badge variant={g.isActive ? 'success' : 'outline'}>
                            {g.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(g)}>
                            Edit
                          </Button>
                          {g.isActive && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivate(g)}
                              disabled={deactivateMutation.isPending}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
