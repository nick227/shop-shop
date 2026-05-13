import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { stores as storesApi } from '@api/apiWrapper'
import { useAuthStore } from '@stores/authStore'

const pillLinkClass =
  'inline-block px-4 py-2 text-sm font-medium text-gray-800 whitespace-nowrap bg-gray-100 rounded-lg border-0 transition-all cursor-pointer hover:bg-gray-200 hover:-translate-y-px'

interface VendorStoreManagerProps {
  readonly onNavigateToVendor?: () => void
  readonly className?: string
}

export function VendorStoreManager({ onNavigateToVendor: _onNavigateToVendor, className = '' }: VendorStoreManagerProps) {
  const { user, isAuthenticated } = useAuthStore()
  const role = user?.role?.toUpperCase()

  const { data: storesData } = useQuery({
    queryKey: ['header-user-stores', user?.id],
    queryFn: async () =>
      storesApi.listPage({ ownerUserId: user?.id, page: '1', limit: '50' }),
    enabled: isAuthenticated && !!user?.id && role !== 'VENDOR' && role !== 'ADMIN',
    staleTime: 60_000,
  })

  const userHasStore = Boolean(storesData?.data?.length)

  // Only show vendor portal to authenticated users
  if (!isAuthenticated) {
    return null
  }

  const getVendorButtonConfig = () => {
    if (role === 'ADMIN') {
      return { text: 'Vendor', destination: '/vendor/dashboard' }
    }

    if (role === 'VENDOR' || userHasStore) {
      return { text: 'Manage Store', destination: '/vendor/dashboard' }
    }

    return { text: 'Create Store', destination: '/vendor/store/new' }
  }

  const buttonConfig = getVendorButtonConfig()

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {role === 'ADMIN' && (
        <Link
          to="/admin"
          className={pillLinkClass}
          aria-label="Admin dashboard"
        >
          ⚙️ Admin
        </Link>
      )}
      <Link
        to={buttonConfig.destination}
        className={pillLinkClass}
        aria-label="Vendor Portal"
      >
        🏪 {buttonConfig.text}
      </Link>
    </div>
  )
}
