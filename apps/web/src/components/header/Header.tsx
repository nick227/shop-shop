import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@stores/cartStore'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useLocationDisplay } from '@shared/hooks/hooks/useLocationDisplay'
import { CartBadge } from '@components/CartBadge'
import { CartModal } from '@features/cart/components/CartModal'
import { SiteBranding } from './SiteBranding'
import { SiteSearch } from './SiteSearch'
import { AuthBlock } from './AuthBlock'
import { AddressDisplay } from './AddressDisplay'
import { VendorStoreManager } from './VendorStoreManager'
import { useHeaderAddressExtrasForMerge } from './HeaderAddressExtrasContext'

interface HeaderProps {
  readonly className?: string
}

const DEFAULT_RADIUS_MILES = 25

export function Header({ className = '' }: HeaderProps) {
  const navigate = useNavigate()
  const addressExtras = useHeaderAddressExtrasForMerge()
  const { location: urlLocation, clearLocation: urlClearLocation } = useUrlLocation()
  const fromUrlDisplay = useLocationDisplay(urlLocation, undefined)
  const cart = useCartStore((state) => state.cart)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  const addressDisplayProps = useMemo(() => {
    if (addressExtras) {
      return {
        locationDisplayName: addressExtras.locationDisplayName,
        currentRadius: addressExtras.currentRadius,
        citiesContextResult: addressExtras.citiesContextResult,
        onClearLocation: addressExtras.onClearLocation,
      }
    }
    if (urlLocation) {
      return {
        locationDisplayName: fromUrlDisplay.locationDisplayName,
        currentRadius: Math.max(urlLocation.radiusMiles ?? DEFAULT_RADIUS_MILES, 5),
        citiesContextResult: fromUrlDisplay.citiesContextResult,
        onClearLocation: urlClearLocation,
      }
    }
    return {
      locationDisplayName: undefined as string | undefined,
      currentRadius: 0,
      citiesContextResult: undefined as { short?: string } | undefined,
      onClearLocation: undefined as (() => void) | undefined,
    }
  }, [
    addressExtras,
    fromUrlDisplay.citiesContextResult,
    fromUrlDisplay.locationDisplayName,
    urlClearLocation,
    urlLocation,
  ])

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

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleVendorNavigate = () => {
    navigate('/vendor/dashboard')
  }

  return (
    <>
      <header className={`bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-[100] ${className}`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Branding and Search */}
            <div className="flex items-center gap-4 flex-1">
              <SiteBranding />
              <SiteSearch onSearch={handleSearch} />
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <VendorStoreManager onNavigateToVendor={handleVendorNavigate} />
              
              <AddressDisplay 
                locationDisplayName={addressDisplayProps.locationDisplayName}
                currentRadius={addressDisplayProps.currentRadius}
                citiesContextResult={addressDisplayProps.citiesContextResult}
                onClearLocation={addressDisplayProps.onClearLocation}
              />
              
              <CartBadge 
                count={cartMetrics.itemCount} 
                total={cartMetrics.total}
                showTotal={true}
                onClick={handleCartClick}
              />
              
              <AuthBlock />
            </div>
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
