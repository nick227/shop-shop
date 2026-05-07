/**
 * CustomerLayout - Unified layout for customer account pages
 * Provides consistent navigation and structure
 */

import { Outlet } from 'react-router-dom'
import { useCustomerStats } from '@shared/hooks/hooks/customer/useCustomerStats'
import { PageTransition } from '@shared/ui/layout/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export function CustomerLayout() {
  const { data: stats } = useCustomerStats()
  const location = useLocation()

  return (
    <div className="pb-20 min-h-screen bg-background text-foreground">
      {/* Top Bar — glassmorphic, consistent with BottomNav */}
      
      {/* Main Content */}
      <main className="overflow-x-hidden relative w-full">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {stats && stats.pendingOrders > 0 && (
        <span className="sr-only">{stats.pendingOrders}</span>
      )}
        
    </div>
  )
}
