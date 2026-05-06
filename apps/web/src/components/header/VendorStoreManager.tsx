import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuthStore } from '@stores/authStore'

interface VendorStoreManagerProps {
  onNavigateToVendor?: () => void
  className?: string
}

export function VendorStoreManager({ onNavigateToVendor, className = '' }: VendorStoreManagerProps) {
  const { user, isAuthenticated } = useAuthStore()
  const role = user?.role?.toUpperCase()

  const { data: storesData } = useQuery({
    queryKey: ['header-user-stores', user?.id],
    queryFn: async () => apiClient.stores().listStores({ ownerUserId: user?.id } as any),
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
      return { text: 'Admin', destination: '/vendor/dashboard' }
    }

    if (role === 'VENDOR' || userHasStore) {
      return { text: 'Manage Store', destination: '/vendor/dashboard' }
    }

    return { text: 'Create Store', destination: '/vendor/store/new' }
  }

  const buttonConfig = getVendorButtonConfig()

  return (
    <div className={className}>
      <Link
        to={buttonConfig.destination}
        className="px-4 py-2 rounded-lg border-0 cursor-pointer text-sm font-medium transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 hover:-translate-y-px inline-block"
        aria-label="Vendor Portal"
      >
        🏪 {buttonConfig.text}
      </Link>
    </div>
  )
}
