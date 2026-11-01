// @ts-nocheck
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button, SearchInput, Badge, Pagination } from '@shared/ui/primitives'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared/ui/primitives/ui/Card/Card'
import { VendorPage } from '@layouts/VendorLayout/page'
import { MenuTabs } from './components/MenuTabs'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Layers, Edit, Trash2, Plus } from 'lucide-react'
import { usePaginatedList } from '@shared/hooks/usePaginatedList'
import { formatCurrency } from '@shared/lib/utils/format'
import { useHaptics } from '@shared/hooks/useHaptics'

export default function StoreBundlesPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => apiClient.stores().getStoreById({ id: storeId! }),
    enabled: !!storeId,
  })

  const { data: bundlesData, isLoading: isLoadingBundles } = useQuery({
    queryKey: ['bundles', storeId],
    queryFn: () => apiClient.bundles().listBundles({ storeId }),
    enabled: !!storeId,
  })

  const deleteMutation = useMutation({
    mutationFn: (bundleId: string) => apiClient.bundles().deleteBundle({ id: bundleId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bundles', storeId] })
      toast.success('Bundle deleted')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const bundles = (bundlesData?.data ?? []).filter((b: any) => b.storeId === storeId)

  const paginatedList = usePaginatedList({
    items: bundles,
    pageSize: 20,
    searchQuery,
    searchFields: ['name', 'description'],
  })

  const handleDelete = useCallback(
    (bundleId: string, bundleName: string) => {
      if (confirm(`Delete "${bundleName}"?`)) deleteMutation.mutate(bundleId)
    },
    [deleteMutation],
  )

  return (
    <VendorPage
      title="Menu"
      loading={isLoadingStore || isLoadingBundles}
      error={!isLoadingStore && !store ? { message: 'This store could not be loaded' } : undefined}
      tabs={<MenuTabs storeId={storeId!} />}
      actions={
        <Button variant="primary" onClick={() => navigate(vendorPaths.newBundle(storeId!))}>
          <Plus className="mr-1.5 h-4 w-4" />
          New bundle
        </Button>
      }
    >
      <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Bundles combine items from your menu into one listing at one price.</p>
      <div className="w-full sm:w-72">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bundles"
          aria-label="Search bundles"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: bundles.length },
          { label: 'Active', value: bundles.filter((b: any) => b.isActive).length },
          { label: 'Inactive', value: bundles.filter((b: any) => !b.isActive).length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="text-2xl font-bold tracking-tight mb-0.5">{value}</div>
              <div className="text-label">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paginatedList.counts.filtered === 0 ? (
        <EmptyState
          icon={Layers}
          title={searchQuery ? 'No bundles found' : 'No bundles yet'}
          description={
            searchQuery
              ? 'No bundles match your search'
              : 'Create your first bundle to offer combo deals to customers!'
          }
          action={
            !searchQuery && (
              <Button variant="primary" onClick={() => navigate(vendorPaths.newBundle(storeId!))}>
                <Plus className="w-4 h-4 mr-2" /> Create First Bundle
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginatedList.items.map((bundle: any) => (
              <BundleListCard
                key={bundle.id}
                bundle={bundle}
                onEdit={() => navigate(vendorPaths.bundle(storeId!, bundle.id))}
                onDelete={() => handleDelete(bundle.id, bundle.name)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>

          {paginatedList.pagination.totalPages > 1 && (
            <Pagination
              currentPage={paginatedList.pagination.currentPage}
              totalItems={paginatedList.pagination.totalItems}
              pageSize={paginatedList.pagination.pageSize}
              onPageChange={paginatedList.pagination.goToPage}
            />
          )}
        </>
      )}
      </div>
    </VendorPage>
  )
}

function BundleListCard({
  bundle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  bundle: any
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const haptics = useHaptics()
  const items: any[] = bundle.items ?? []
  const resolvedPrice = bundle.pricing?.fixedPrice ?? bundle.pricing?.discountAmount ?? null

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1 mb-1">{bundle.name}</CardTitle>
            {resolvedPrice != undefined && (
              <span className="text-xl font-bold text-success">{formatCurrency(Number(resolvedPrice))}</span>
            )}
          </div>
          <div className="shrink-0">
            {bundle.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="warning">Inactive</Badge>
            )}
          </div>
        </div>
        {bundle.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{bundle.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {items.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{items.length} item{items.length !== 1 ? 's' : ''}:</span>{' '}
            {items.slice(0, 3).map((bi: any) => bi.item?.title ?? bi.title ?? '…').join(', ')}
            {items.length > 3 && ` +${items.length - 3} more`}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-border mt-auto gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => { haptics.heavy(); onDelete() }}
          disabled={isDeleting}
          className="shrink-0 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button variant="primary" className="flex-1" onClick={() => { haptics.light(); onEdit() }}>
          <Edit className="w-4 h-4 mr-2" /> Edit Bundle
        </Button>
      </CardFooter>
    </Card>
  )
}
