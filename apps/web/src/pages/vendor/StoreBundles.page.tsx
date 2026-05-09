// @ts-nocheck
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button, SearchInput, Badge, Spinner, Pagination } from '@shared/ui/primitives'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Layers, Edit, Trash2, ArrowLeft, Plus } from 'lucide-react'
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
      queryClient.invalidateQueries({ queryKey: ['bundles', storeId] })
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

  if (isLoadingStore || isLoadingBundles) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4">
          <Spinner size="large" />
          <p className="mt-4 text-muted-foreground">Loading bundles…</p>
        </div>
      </PageShell>
    )
  }

  if (!store) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center">
          <h2 className="mb-2 text-xl font-bold text-destructive">Store not found</h2>
          <Button variant="primary" onClick={() => navigate('/vendor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader
        title={`${store.name} — Bundles`}
        description="Create and manage combo bundles for your store"
        backButton={
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate(`/vendor/stores/${storeId}/items`)}
            className="-ml-2 text-muted-foreground hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Items
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bundles…"
          className="flex-1 w-full max-w-md"
        />
        <Button
          variant="primary"
          onClick={() => navigate(`/vendor/stores/${storeId}/bundles/new`)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Bundle
        </Button>
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
              <Button variant="primary" onClick={() => navigate(`/vendor/stores/${storeId}/bundles/new`)}>
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
                onEdit={() => navigate(`/vendor/stores/${storeId}/bundles/${bundle.id}/edit`)}
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
    </PageShell>
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
