/**
 * CustomerLayout - Unified layout for customer account pages
 * Provides consistent navigation and structure
 */

import { Outlet } from 'react-router-dom'
import { useCustomerStats } from '@shared/hooks/hooks/customer/useCustomerStats'
import { BottomNav } from '@shared/ui/layout/BottomNav'
import { PageTransition } from '@shared/ui/layout/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export function CustomerLayout() {
  const { data: stats } = useCustomerStats()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Bar — glassmorphic, consistent with BottomNav */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-nav border-b border-border/40 px-4 h-12 flex items-center justify-between pt-[env(safe-area-inset-top)]">
        <h1 className="text-base font-semibold tracking-tight">
          Delivery App
        </h1>
        {stats && stats.pendingOrders > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            {stats.pendingOrders}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full relative overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}
