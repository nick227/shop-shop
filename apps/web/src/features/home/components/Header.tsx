/**
 * Header - Component for the main header with navigation and integrated cart modal;
 */
import React, { useState } from 'react'
import { useCartStore } from '@stores/cartStore'
import { CartBadge } from '@components/CartBadge'
import { CartModal } from '@features/cart/components/CartModal'

interface HeaderProps {
  locationDisplayName: string | undefined;
  currentRadius: number;
  citiesContextResult: { short?: string }
  onClearLocation: () => void;
  onNavigateToVendor: () => void;
}

export function Header({ 
  locationDisplayName, 
  currentRadius, 
  citiesContextResult, 
  onClearLocation, 
  onNavigateToVendor
}: HeaderProps) {
  const cart = useCartStore((state) => state.cart)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  // Calculate cart metrics
  const cartMetrics = React.useMemo(() => {
    if (!cart?.items) return { itemCount: 0, total: 0 }
    
    try {
      const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items
      const itemCount = items.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0)
      return {
        itemCount,
        total: cart.total || 0
      }
    } catch {
      return { itemCount: 0, total: 0 }
    }
  }, [cart])

  const handleCartClick = () => {
    setIsCartModalOpen(true)
  }

  const handleCloseCartModal = () => {
    setIsCartModalOpen(false)
  }

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-[100]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-gray-800">Shop Shop</div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button" 
              onClick={onNavigateToVendor}
              className="px-4 py-2 rounded-lg border-0 cursor-pointer text-sm font-medium transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 hover:-translate-y-px"
              aria-label="Vendor Portal"
            >
              🏪 Sell
            </button>
            
            {locationDisplayName && (
              <button
                type="button" 
                className="px-4 py-2 rounded-lg border-0 cursor-pointer text-sm font-medium transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 hover:-translate-y-px"
                onClick={onClearLocation}
                aria-label={'Change location. Current: ${locationDisplayName}, ' + currentRadius + ' miles'}
              >
                📍 {citiesContextResult.short || locationDisplayName} · {currentRadius} mi
              </button>
            )}
            
            <CartBadge 
              count={cartMetrics.itemCount} 
              total={cartMetrics.total}
              showTotal={true}
              onClick={handleCartClick}
            />
          </div>
        </div>
      </header>

      {/* Cart Modal */}
      <CartModal 
        isOpen={isCartModalOpen} 
        onClose={handleCloseCartModal} 
      />
    </>
  )
}
