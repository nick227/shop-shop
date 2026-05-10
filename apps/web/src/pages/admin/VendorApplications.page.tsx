import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { ClipboardList, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface VendorApplication {
  id: string
  status: string
  createdAt: string
  user: { id: string; name: string | null; email: string }
  businessName: string | null
  businessType: string | null
}

interface ConfirmDialogProps {
  message: string
  requireReason?: boolean
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

function ConfirmDialog({ message, requireReason, onConfirm, onCancel }: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm">{message}</p>
        </div>
        {requireReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason (required)"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="small" onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            size="small"
            disabled={requireReason && !reason.trim()}
            onClick={() => onConfirm(reason || undefined)}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminVendorApplicationsPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [pendingDecision, setPendingDecision] = useState<{ id: string; decision: 'approve' | 'reject' } | null>(null)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendor-applications'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/vendor-applications`, { headers })
      if (!res.ok) throw new Error('Failed to load applications')
      return res.json() as Promise<{ applications: VendorApplication[] }>
    },
  })

  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision, rejectionReason }: { id: string; decision: 'approve' | 'reject'; rejectionReason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/vendor-applications/${id}/decision`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ decision, rejectionReason }),
      })
      if (!res.ok) throw new Error('Failed to process application')
      return res.json()
    },
    onSuccess: (_, { decision }) => {
      toast.success(decision === 'approve' ? 'Application approved' : 'Application rejected')
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setPendingDecision(null)
    },
    onError: (e: Error) => { toast.error(e.message); setPendingDecision(null) },
  })

  const applications = data?.applications ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      {pendingDecision && (
        <ConfirmDialog
          message={
            pendingDecision.decision === 'approve'
              ? 'Approve this vendor application? The user will be granted Vendor access.'
              : 'Reject this vendor application? Please provide a reason so the applicant knows what to improve.'
          }
          requireReason={pendingDecision.decision === 'reject'}
          onConfirm={(reason) => decisionMutation.mutate({ ...pendingDecision, rejectionReason: reason })}
          onCancel={() => setPendingDecision(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Vendor Applications</h1>
        <p className="text-sm text-muted-foreground">Pending applications for vendor access</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No pending applications"
          description="All vendor applications have been reviewed."
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{app.user.name ?? app.user.email}</span>
                    <Badge variant="warning">{app.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {app.user.email}
                    {app.businessName && ` · ${app.businessName}`}
                    {app.businessType && ` · ${app.businessType}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="primary"
                    onClick={() => setPendingDecision({ id: app.id, decision: 'approve' })}
                    disabled={decisionMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setPendingDecision({ id: app.id, decision: 'reject' })}
                    disabled={decisionMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
