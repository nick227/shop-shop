/**
 * Order alerts on this device: sound and desktop notifications, chosen per store.
 * Lists only stores whose orders you can see. New orders from every listed store
 * still show in the store switcher and as a toast whatever is chosen here.
 */
import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/ui/primitives'
import { playOrderSound, useOrderAlertPrefs } from '@shared/hooks/hooks/vendor'
import { cn } from '@shared/lib/cn'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import { StoreAvatar } from './StoreAvatar'
import { canAccess } from './storeAccess'

type PermissionState = NotificationPermission | 'unsupported'

function currentPermission(): PermissionState {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  readonly label: string
  readonly checked: boolean
  readonly disabled?: boolean
  readonly onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
        checked ? 'bg-foreground' : 'bg-muted-foreground/30',
      )}
    >
      <span
        aria-hidden
        className={cn('inline-block h-4 w-4 rounded-full bg-background transition-transform', checked ? 'translate-x-5' : 'translate-x-1')}
      />
    </button>
  )
}

export function OrderAlertsDialog({ open, onOpenChange }: { readonly open: boolean; readonly onOpenChange: (open: boolean) => void }) {
  const { stores, selectedStoreId } = useVendorActiveStore()
  const { choiceFor, setChoice } = useOrderAlertPrefs(selectedStoreId)
  const [permission, setPermission] = useState<PermissionState>(currentPermission)
  const orderStores = stores.filter((store) => canAccess(store, 'VIEW_ORDERS'))

  const allowDesktop = async () => {
    if (permission !== 'default') return permission
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  const setDesktop = async (storeId: string, next: boolean) => {
    if (next && (await allowDesktop()) !== 'granted') return
    setChoice(storeId, { desktop: next })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order alerts on this device</DialogTitle>
          <DialogDescription>
            Choose which stores make a sound or show a desktop notification here. New orders from all your stores still
            appear in the store switcher.
          </DialogDescription>
        </DialogHeader>

        {permission === 'denied' ? (
          <p className="rounded-lg bg-warning/15 p-3 text-sm">
            This browser blocks notifications from ShopShop. Allow them in the browser’s site settings to turn desktop
            alerts on.
          </p>
        ) : null}
        {permission === 'unsupported' ? (
          <p className="rounded-lg bg-muted p-3 text-sm">This browser doesn’t support desktop notifications.</p>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5 gap-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Store</span>
          <span className="text-xs font-medium text-muted-foreground">Sound</span>
          <span className="text-xs font-medium text-muted-foreground">Desktop</span>
          {orderStores.map((store) => {
            const choice = choiceFor(store.id)
            return (
              <div key={store.id} className="contents">
                <div className="flex min-w-0 items-center gap-3 py-2">
                  <StoreAvatar name={store.name} imageUrl={store.imageUrl} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{store.name}</span>
                    {store.id === selectedStoreId ? (
                      <span className="block text-xs text-muted-foreground">Working in now</span>
                    ) : null}
                  </span>
                </div>
                <Toggle
                  label={`Sound for ${store.name}`}
                  checked={choice.sound}
                  onChange={(next) => setChoice(store.id, { sound: next })}
                />
                <Toggle
                  label={`Desktop notifications for ${store.name}`}
                  checked={choice.desktop && permission === 'granted'}
                  disabled={permission === 'denied' || permission === 'unsupported'}
                  onChange={(next) => void setDesktop(store.id, next)}
                />
              </div>
            )
          })}
        </div>
        {orderStores.length === 0 ? (
          <p className="text-sm text-muted-foreground">You don’t see orders for any store, so there’s nothing to alert you about.</p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="small" onClick={playOrderSound}>
            <Volume2 className="mr-1.5 h-4 w-4" />
            Play test sound
          </Button>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
