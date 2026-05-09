/**
 * Danger zone for permanently deleting a store — requires typing the store name.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/primitives/ui/Dialog'
import { Input } from '@shared/ui/primitives/ui/Input/Input'

export interface DeleteStoreSectionProps {
  readonly storeId: string
  readonly storeName: string
  readonly onDeleted: () => void
}

export function DeleteStoreSection({ storeId, storeName, onDeleted }: DeleteStoreSectionProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const trimmedName = storeName.trim()
  const canSubmit =
    trimmedName.length > 0 && confirmText.trim() === trimmedName

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.stores().deleteStore({ id: storeId })
    },
    onSuccess: () => {
      setOpen(false)
      setConfirmText('')
      onDeleted()
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setConfirmText('')
  }

  return (
    <>
      <Card className="border-destructive/40 bg-destructive/[0.03]">
        <CardContent className="space-y-4 p-6">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Delete store</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once deleted, this store, its catalog, and vendor-only settings for it are removed.
                This cannot be undone.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            className="h-11"
            onClick={() => setOpen(true)}
            disabled={deleteMutation.isPending}
          >
            Delete store…
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-destructive">
              Delete “{trimmedName}”?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes the store and its catalog. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">You will lose:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>All items and bundles for this store</li>
              <li>Visibility of this store to customers</li>
            </ul>
            <p>
              Type{' '}
              <span className="break-all font-mono font-semibold text-foreground">{trimmedName}</span>
              {' '}below to confirm.
            </p>
          </div>

          <Input
            label="Store name"
            placeholder={trimmedName}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            autoFocus
            aria-invalid={confirmText.length > 0 && !canSubmit}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!canSubmit || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              isLoading={deleteMutation.isPending}
            >
              Delete store permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
