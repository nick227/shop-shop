// @ts-nocheck
/**
 * VendorDashboardPage - Vendor's store management dashboard
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { stores as storesApi } from '@api/apiWrapper'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useAuthStore } from '@stores/authStore'
import { Button, SearchInput, Badge, Spinner } from '@shared/ui/primitives'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Package, Edit, Store as StoreIcon, LogOut, ArrowLeft, Check } from 'lucide-react'
import type { StoreResponse } from '@api/types'
import { useHaptics } from '@shared/hooks/useHaptics'
import { usePublicMediaList } from '@shared/hooks/hooks/vendor/usePublicMediaList'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'

export default function VendorDashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const persistedUser = useAuthStore((state) => state.user)
  const currentUser = user ?? persistedUser
  const [searchQuery, setSearchQuery] = useState('')
  const { selectedStoreId, setSelectedStoreId } = useVendorActiveStore()

  // Fetch stores owned by the signed-in user. Store creation is the vendor conversion event.
  const { data: storesData, isLoading, error } = useQuery({
    queryKey: ['vendor-stores', currentUser?.id],
    queryFn: async () => {
      return await storesApi.listPage({
        ownerUserId: currentUser?.id,
        page: '1',
        limit: '100',
      })
    },
    enabled: !!currentUser?.id,
  })

  const stores = (storesData?.data ?? []) as unknown as StoreResponse[]

  // Filter stores by search query, active store floats to first position
  // Must be above early returns to satisfy rules of hooks
  const filteredStores = useMemo(() => {
    const filtered = stores.filter((store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return [...filtered].sort((a, b) => {
      if (a.id === selectedStoreId) return -1
      if (b.id === selectedStoreId) return 1
      return 0
    })
  }, [stores, searchQuery, selectedStoreId])

  if (isLoading) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4">
          <Spinner size="large" />
          <p className="mt-4 text-muted-foreground">Loading your stores...</p>
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center">
          <h2 className="mb-2 text-xl font-bold text-destructive">Failed to load stores</h2>
          <p className="mb-4 text-muted-foreground">Please try refreshing the page</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </PageShell>
    )
  }

  // Redirect vendors with no stores to store setup
  if (stores.length === 0) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center">
          <div className="mb-4">
            <StoreIcon className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Create Your First Store</h2>
          <p className="text-muted-foreground mb-6">
            Add the required store details and your profile goes live immediately.
          </p>
          <Button
            onClick={() => navigate('/vendor/store/new')}
            className="w-full"
          >
            Create Store
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader
        title="My Stores"
        description="Manage your stores and menu items"
        backButton={
          <Button variant="ghost" size="small" onClick={() => navigate('/')} className="-ml-2 text-muted-foreground hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Home
          </Button>
        }
        actions={
          <Button variant="ghost" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        }
      />

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stores..."
          className="flex-1 max-w-md"
        />
        <Button
          variant="primary"
          onClick={() => navigate('/vendor/store/new')}
        >
          <StoreIcon className="w-4 h-4 mr-2" />
          Create Store
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="text-2xl font-bold tracking-tight mb-0.5">{stores.length}</div>
            <div className="text-label">Total Stores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="text-2xl font-bold tracking-tight mb-0.5">
              {stores.filter(s => s.isPublished).length}
            </div>
            <div className="text-label">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="text-2xl font-bold tracking-tight mb-0.5">
              {stores.filter(s => !s.isPublished).length}
            </div>
            <div className="text-label">Drafts</div>
          </CardContent>
        </Card>
      </div>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title={searchQuery ? "No stores found" : "No stores yet"}
          description={searchQuery ? "No stores match your search criteria" : "Create your first store to start selling!"}
          action={
            !searchQuery && (
              <Button variant="primary" onClick={() => navigate('/vendor/store/new')}>
                <StoreIcon className="w-4 h-4 mr-2" />
                Create Your First Store
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStores.map((store) => (
            <VendorStoreCard
              key={store.id}
              store={store}
              isActive={store.id === selectedStoreId}
              onSelect={() => setSelectedStoreId(store.id)}
              onEdit={() => navigate('/vendor/stores/' + store.id + '/edit')}
              onViewItems={() => navigate('/vendor/stores/' + store.id + '/items')}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}

// Vendor-specific store card with management actions
interface VendorStoreCardProps {
  readonly store: StoreResponse
  readonly isActive: boolean
  readonly onSelect: () => void
  readonly onEdit: () => void
  readonly onViewItems: () => void
}

function VendorStoreCard({ store, isActive, onSelect, onEdit, onViewItems }: VendorStoreCardProps) {
  const haptics = useHaptics()
  const { data: media } = usePublicMediaList({ storeId: store.id })
  const imageUrl = media?.find((m) => m.kind === 'IMAGE' || !m.kind)?.url

  return (
    <Card className={`flex flex-col overflow-hidden transition-colors tap-scale active:scale-[0.98] ${isActive ? 'border-green-500 border-2 ring-2 ring-green-500/20' : 'hover:border-green-500/50'}`}>
      <div className="border-b border-border/50 h-36 overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={store.name}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>

      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl line-clamp-1">{store.name}</CardTitle>
            {(store.addressCity || store.addressState) && (
              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                {store.addressCity}{store.addressCity && store.addressState ? ', ' : ''}{store.addressState}
              </div>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            {isActive && <Badge variant="default">Active</Badge>}
            {store.isPublished ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="warning">Draft</Badge>
            )}
          </div>
        </div>
        {store.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm mt-2">{store.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="pb-4 space-y-2 text-sm flex-1">
        {store.companyName && (
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Company:</span>
            <span className="font-medium truncate ml-4">{store.companyName}</span>
          </div>
        )}
        {store.email && (
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium truncate ml-4">{store.email}</span>
          </div>
        )}
        {store.phone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium truncate ml-4">{store.phone}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-border gap-2">
        <Button
          variant={isActive ? 'primary' : 'outline'}
          className="flex-1"
          disabled={isActive}
          onClick={() => { haptics.light(); onSelect(); }}
        >
          <Check className="w-4 h-4 mr-2" />
          {isActive ? 'Active' : 'Select'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => { haptics.light(); onViewItems(); }}
        >
          <Package className="w-4 h-4 mr-2" />
          Items
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => { haptics.light(); onEdit(); }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  )
}
