import { useAccountCapabilities } from '@features/account/useAccountCapabilities'
/**
 * Personal account — the person signed in, top right. Never the store.
 */
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, ShoppingBag, UserRound } from 'lucide-react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Menu, MenuItem, MenuSeparator } from '@shared/ui/primitives/ui/Menu'

function personInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '?'
  const words = source.split(/[\s.@]+/).filter(Boolean)
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)).toUpperCase()
}

interface AccountMenuProps {
  /** Shown only inside the seller workspace, where order alerts apply. */
  readonly onOpenOrderAlerts?: () => void
}

export function AccountMenu({ onOpenOrderAlerts }: AccountMenuProps = {}) {
  const { capabilities } = useAccountCapabilities()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const name = user?.name?.trim()
  const email = user?.email

  return (
    <Menu
      label="Your account"
      align="end"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label="Your account"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground hover:ring-2 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {personInitials(name, email)}
        </button>
      )}
    >
      <div className="border-b border-border px-4 pb-3 pt-2">
        {name ? <p className="truncate font-semibold">{name}</p> : null}
        {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
      </div>
      <div className="pt-1" />
      <MenuItem to="/account/profile" icon={<UserRound className="h-4 w-4" />}>
        Your account
      </MenuItem>
      {onOpenOrderAlerts ? (
        <MenuItem icon={<Bell className="h-4 w-4" />} onSelect={onOpenOrderAlerts}>
          Order alerts on this device
        </MenuItem>
      ) : null}
      <MenuItem to="/" icon={<ShoppingBag className="h-4 w-4" />}>
        Back to shopping
      </MenuItem>
      {capabilities?.canAccessVendorPortal ? <MenuItem to="/vendor">Vendor Portal</MenuItem> : null}
      {capabilities?.platformRole === 'ADMIN' ? <MenuItem to="/admin">Administration</MenuItem> : null}
      <MenuSeparator />
      <MenuItem
        icon={<LogOut className="h-4 w-4" />}
        onSelect={() => {
          void (async () => {
            await logout()
            navigate('/')
          })()
        }}
      >
        Sign out
      </MenuItem>
    </Menu>
  )
}
