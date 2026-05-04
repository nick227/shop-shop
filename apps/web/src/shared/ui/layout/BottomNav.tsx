import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@shared/lib/cn'
import { useHaptics } from '@shared/hooks/useHaptics'

export function BottomNav() {
  const location = useLocation()
  const haptics = useHaptics()
  
  const navItems = [
    { label: 'Home', icon: Home, path: '/customer' },
    { label: 'Search', icon: Search, path: '/customer/search' },
    { label: 'Cart', icon: ShoppingBag, path: '/checkout' },
    { label: 'Profile', icon: User, path: '/customer/profile' },
  ]

  // Hide bottom nav on specific deep detail pages where we want full screen
  const hideOnPages = ['/customer/items/']
  if (hideOnPages.some(p => location.pathname.includes(p))) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-background/80 backdrop-blur-nav border-t border-border/40">
      <nav className="flex justify-around items-center h-14 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/customer' && location.pathname.startsWith(item.path))
          
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => haptics.light()}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
