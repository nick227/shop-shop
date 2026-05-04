// @ts-nocheck
/**
 * VendorDashboardPage - Vendor's store management dashboard
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuth } from '@shared/hooks/hooks/useAuth'
import { Button, SearchInput, Badge, Spinner } from '@shared/ui/primitives'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared/ui/primitives/ui/Card/Card'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Package, Edit, Store as StoreIcon, LogOut, ArrowLeft } from 'lucide-react'
import type { StoreResponse } from '@api/types'
import { useHaptics } from '@shared/hooks/useHaptics'

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

  const stores = (storesData?.data ?? []) as unknown as StoreResponse[]

  // Filter stores by search query
  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="large" />
        <p className="mt-4 text-muted-foreground">Loading your stores...</p>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Failed to load stores</h2>
          <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Stores"
        description="Manage your stores and menu items"
        breadcrumbs={
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
          onClick={() => navigate('/vendor/stores/new')}
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
              <Button variant="primary" onClick={() => navigate('/vendor/stores/new')}>
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
              onEdit={() => navigate('/vendor/stores/' + store.id + '/edit')}
              onViewItems={() => navigate('/vendor/stores/' + store.id + '/items')}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

// Vendor-specific store card with management actions
interface VendorStoreCardProps {
  readonly store: StoreResponse
  readonly onEdit: () => void
  readonly onViewItems: () => void
}

function VendorStoreCard({ store, onEdit, onViewItems }: VendorStoreCardProps) {
  const haptics = useHaptics()

  return (
    <Card className="flex flex-col hover:border-primary/50 transition-colors tap-scale active:scale-[0.98]">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl line-clamp-1">{store.name}</CardTitle>
          <div className="shrink-0">
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
