import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@shared/ui/primitives'

export interface BulkDeleteConfirmDialogProps {
  readonly entityLabel: string
  readonly count: number
  readonly previewLines?: readonly string[]
  readonly extraWarning?: string
  readonly requireReason?: boolean
  readonly isDeleting: boolean
  readonly disableConfirm?: boolean
  readonly onConfirm: (reason?: string) => void
  readonly onCancel: () => void
}

export function BulkDeleteConfirmDialog({
  entityLabel,
  count,
  previewLines = [],
  extraWarning,
  requireReason = false,
  isDeleting,
  disableConfirm = false,
  onConfirm,
  onCancel,
}: BulkDeleteConfirmDialogProps) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Confirm bulk delete</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete {count} {entityLabel}? This cannot be undone.
            </p>
          </div>
        </div>
        {previewLines.length > 0 && (
          <div className="max-h-28 overflow-y-auto border border-border rounded-md p-2 text-xs space-y-1">
            {previewLines.slice(0, 8).map((line, i) => (
              <div key={`${line}-${i}`} className="text-muted-foreground">
                {line}
              </div>
            ))}
            {previewLines.length > 8 && (
              <div className="text-center text-muted-foreground">…and {previewLines.length - 8} more</div>
            )}
          </div>
        )}
        {extraWarning && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {extraWarning}
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Reason (optional, audit log)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for deletion…"
            rows={2}
            className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="small" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="small"
            disabled={isDeleting || disableConfirm || (requireReason && !reason.trim())}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {isDeleting ? 'Deleting…' : `Delete ${count}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
