import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Button } from '@shared/ui/primitives'
import { BarChart3, DollarSign, Settings, Handshake, LogOut } from 'lucide-react'
import { AffiliateStatusGate } from './AffiliateStatusGate'

const navItems = [
  { path: '/affiliate/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/affiliate/commissions', label: 'Commissions', icon: DollarSign },
  { path: '/affiliate/payouts', label: 'Payouts', icon: Handshake },
  { path: '/affiliate/settings', label: 'Settings', icon: Settings },
]

export function AffiliateLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold hover:text-primary"
          >
            Shop-Shop
          </button>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Affiliate Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="ghost" size="small" onClick={logout}>
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:block">
          <nav className="space-y-1 p-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <AffiliateStatusGate />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card md:hidden">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
