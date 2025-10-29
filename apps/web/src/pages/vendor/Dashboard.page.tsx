/**
 * VendorDashboardPage - Vendor's store management dashboard
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuth } from '@hooks/useAuth'
import { Button, SearchInput, Badge, Spinner } from '@ui'
import type { StoreResponse, Store } from '@api/backend-types'
import { styles } from '@utils/tailwind-classes'

export default function VendorDashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch vendor's stores
  const { data: storesData, isLoading, error } = useQuery({
    queryKey: ['vendor-stores', user?.id],
    queryFn: async () => {
      return await apiClient.stores().listStores({})
    },
    enabled: !!user,
  })

  const stores = (storesData?.data ?? []) as unknown as Store[]

  // Filter stores by search query
  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <p>Loading your stores...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Failed to load stores</h2>
        <p>Please try refreshing the page</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>🏪 My Stores</h1>
          <p className={styles.subtitle}>Manage your stores and menu items</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className={styles.actionsBar}>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stores..."
          className={styles.searchInput}
        />
        <Button
          variant="primary"
          onClick={() => navigate('/vendor/stores/new')}
        >
          + Create Store
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stores.length}</div>
          <div className={styles.statLabel}>Total Stores</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {stores.filter(s => s.isPublished).length}
          </div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {stores.filter(s => !s.isPublished).length}
          </div>
          <div className={styles.statLabel}>Drafts</div>
        </div>
      </div>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? (
            <>
              <h3>No stores found</h3>
              <p>No stores match your search criteria</p>
            </>
          ) : (
            <>
              <h3>No stores yet</h3>
              <p>Create your first store to start selling!</p>
              <Button
                variant="primary"
                onClick={() => navigate('/vendor/stores/new')}
              >
                Create Your First Store
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.storesList}>
          {filteredStores.map((store) => (
            <VendorStoreCard
              key={store.id}
              store={store}
              onEdit={() => navigate('/vendor/stores/' + store.id + '/edit')}
              onViewItems={() => navigate('/vendor/stores/' + store.id + '/items')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Vendor-specific store card with management actions
interface VendorStoreCardProps {
  readonly store: Store
  readonly onEdit: () => void
  readonly onViewItems: () => void
}

function VendorStoreCard({ store, onEdit, onViewItems }: VendorStoreCardProps) {
  return (
    <div className={styles.vendorStoreCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.storeName}>{store.name}</h3>
        <div className={styles.badges}>
          {store.isPublished ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>
      </div>

      {store.description && (
        <p className={styles.storeDescription}>{store.description}</p>
      )}

      <div className={styles.storeInfo}>
        {store.companyName && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Company:</span>
            <span className={styles.infoValue}>{store.companyName}</span>
          </div>
        )}
        {store.email && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email:</span>
            <span className={styles.infoValue}>{store.email}</span>
          </div>
        )}
        {store.phone && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Phone:</span>
            <span className={styles.infoValue}>{store.phone}</span>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        <Button variant="ghost" size="small" onClick={onViewItems}>
          📦 Manage Items
        </Button>
        <Button variant="primary" size="small" onClick={onEdit}>
          ✏️ Edit Store
        </Button>
      </div>
    </div>
  )
}

