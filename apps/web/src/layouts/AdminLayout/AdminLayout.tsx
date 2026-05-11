import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Button } from '@shared/ui/primitives'
import {
  LayoutDashboard,
  Users,
  Store,
  Handshake,
  LogOut,
  Shield,
  FileText,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  DollarSign,
  Newspaper,
  Layers,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/river', label: 'River', icon: Newspaper },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/vendors', label: 'Vendors', icon: Store },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/delivery', label: 'Delivery', icon: Truck },
  { path: '/admin/catalog', label: 'Catalog', icon: Package },
  { path: '/admin/affiliates', label: 'Affiliates', icon: Handshake },
  { path: '/admin/payout-groups', label: 'Payout Groups', icon: Layers },
  { path: '/admin/finance', label: 'Finance', icon: DollarSign },
  { path: '/admin/audit', label: 'Audit Log', icon: FileText },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

function SideNav() {
  const location = useLocation()

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

function MobileBottomNav() {
  const location = useLocation()
  const primaryItems = NAV_ITEMS.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card md:hidden">
      {primaryItems.map((item) => {
        const active = item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path)
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold hover:text-primary"
          >
            Shop-Shop
          </button>
          <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
            Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:block">{user?.name}</span>
          <Button variant="ghost" size="small" onClick={logout}>
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
