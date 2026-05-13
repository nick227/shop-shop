import { Link, useLocation } from 'react-router-dom'
import { Home, Store, ShoppingCart, User, Menu } from 'lucide-react'
import { cn } from '@shared/lib/utils/cn'
import { useState } from 'react'
import { BottomSheet } from '@shared/ui/primitives'

interface MobileShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
  title?: string;
}

/**
 * Mobile app shell with safe areas and bottom navigation;
 * Provides native-like mobile experience;
 */
export function MobileShell({ 
  children, 
  showHeader = true, 
  showBottomNav = true,
  title = 'Shop Shop'
}: MobileShellProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { path: '/river', icon: Home, label: 'Home' },
    { path: '/search', icon: Store, label: 'Stores' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="flex flex-col h-screen bg-background" data-testid="mobile-shell">
      {/* Header with safe area */}
      {showHeader && (
        <header className="safe-area-inset-top sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur-nav">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 tap-scale"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>
      )}

      {/* Main content with scroll */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom navigation with safe area */}
      {showBottomNav && (
        <nav className="safe-area-inset-bottom sticky bottom-0 z-30 flex items-center justify-around h-16 border-t border-border bg-background/95 backdrop-blur-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 tap-scale transition-colors',
                  isActive
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}

      {/* Menu drawer */}
      <BottomSheet
        open={menuOpen} 
        onOpenChange={setMenuOpen}
        title="Menu"
      >
        <div className="space-y-2">
          <Link
            to="/settings" 
            className="block p-4 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Settings
          </Link>
          <Link
            to="/orders" 
            className="block p-4 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            My Orders
          </Link>
          <Link
            to="/help" 
            className="block p-4 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Help & Support
          </Link>
        </div>
      </BottomSheet>
    </div>
  )
}

