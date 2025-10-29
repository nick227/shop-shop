/**
 * ConfirmDialog - Proper friction for critical actions
 * Replaces window.confirm() with emotional, controlled experience
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@shared/ui/primitives/Dialog'
import { Button } from '@shared/ui/primitives/Button'
import { useState, useCallback } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

/**
 * Modal confirmation with intentional friction
 * - Visual pause before action
 * - Clear consequence description
 * - Prominent danger styling for destructive actions
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook for easy confirmation dialogs
 * Usage:
 *   const confirm = useConfirm()
 *   await confirm({ title: 'Delete?', description: '...' })
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    resolve: ((value: boolean) => void) | undefined
    props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'> | undefined
  }>({
    open: false,
    resolve: undefined,
    props: undefined
  })

  const confirm = useCallback((props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        resolve,
        props
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState({ open: false, resolve: undefined, props: undefined })
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState({ open: false, resolve: undefined, props: undefined })
  }, [state.resolve])

  const dialog = state.props ? (
    <ConfirmDialog
      {...state.props}
      open={state.open}
      onOpenChange={(open) => !open && handleCancel()}
      onConfirm={handleConfirm}
    />
  ) : undefined

  return { confirm, dialog }
}

