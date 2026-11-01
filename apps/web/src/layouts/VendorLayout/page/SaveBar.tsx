/**
 * SaveBar — sticky save for forms, shown only when something changed.
 * Leaving with unsaved changes asks before discarding them.
 */
import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { Button, ConfirmDialog } from '@shared/ui/primitives'

interface SaveBarProps {
  readonly dirty: boolean
  readonly saving: boolean
  /** Show even when nothing changed, e.g. while creating. */
  readonly always?: boolean
  readonly hint?: string
  readonly saveLabel?: string
  readonly onDiscard?: () => void
}

export function SaveBar({ dirty, saving, always = false, hint, saveLabel = 'Save', onDiscard }: SaveBarProps) {
  if (!dirty && !always) return null
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex items-center justify-end gap-3">
        <p className="mr-auto text-sm text-muted-foreground">{hint ?? (dirty ? 'You have unsaved changes.' : '')}</p>
        {dirty && onDiscard ? (
          <Button type="button" variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={saving} isLoading={saving}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </div>
    </div>
  )
}

/** Blocks in-app navigation and tab close while `dirty`; render the returned dialog. */
export function UnsavedChangesGuard({ dirty }: { readonly dirty: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset()
      }}
      title="Discard unsaved changes?"
      description="You changed this page without saving. Leaving now discards those changes."
      confirmLabel="Discard and leave"
      cancelLabel="Keep editing"
      variant="danger"
      onConfirm={() => blocker.proceed?.()}
    />
  )
}
