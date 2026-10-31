/**
 * Danger zone for permanently deleting a store — requires typing the store name.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button } from '@shared/ui/primitives'
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
      <section className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-medium text-foreground">Delete store</h3>
        <p className="text-sm text-muted-foreground">
          Deleting {trimmedName} removes the store, its catalog, and its settings. This cannot be undone.
        </p>
        <Button
          type="button"
          variant="danger"
          size="small"
          onClick={() => setOpen(true)}
          disabled={deleteMutation.isPending}
        >
          Delete store
        </Button>
      </section>

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
