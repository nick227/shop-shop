/**
 * StoreItemsPage - Manage items for a specific store with sales analytics
 */
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
import { Package, Edit, Trash2, ArrowLeft, Plus, BarChart3, Grid } from 'lucide-react'
import { usePaginatedList } from '@shared/hooks/usePaginatedList'
import type { ItemResponse } from '@api/types'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { useHaptics } from '@shared/hooks/useHaptics'
import { ItemAnalyticsTable } from './components/ItemAnalyticsTable'
import { CsvImportButton } from './components/CsvImportButton'

export default function StoreItemsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'analytics' | 'cards'>('analytics')

  // Fetch store details
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      return await apiClient.stores().getStoreById({ id: storeId! })
    },
    enabled: !!storeId,
  })

  // Fetch store items
  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['store-items', storeId],
    queryFn: async () => {
      return await apiClient.items().listItems({})
    },
    enabled: !!storeId,
  })

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiClient.items().deleteItem({ id: itemId })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['store-items', storeId] })
      toast.success('Item deleted successfully!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const items = (itemsData?.data ?? []) as unknown as ItemResponse[]

  const paginatedList = usePaginatedList({
    items: items,
    pageSize: 20,
    searchQuery,
    searchFields: ['title', 'description'],
  })

  const handleDeleteItem = useCallback((itemId: string, itemTitle: string) => {
    if (confirm('Are you sure you want to delete "' + itemTitle + '"?')) {
      setDeletingItemId(itemId)
      deleteItemMutation.mutate(itemId, {
        onSettled: () => setDeletingItemId(null),
      })
    }
  }, [deleteItemMutation])

  if (isLoadingStore || isLoadingItems) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4">
          <Spinner size="large" />
          <p className="mt-4 text-muted-foreground">Loading store items...</p>
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
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader
        title={`${store.name} - Menu Items`}
        description="Manage your menu items with sales analytics"
        backButton={
          <Button variant="ghost" size="small" onClick={() => navigate('/vendor/dashboard')} className="-ml-2 text-muted-foreground hover:bg-transparent">
            <ArrowLeft className="mr-1 w-4 h-4" />
            Dashboard
          </Button>
        }
      />

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 items-start sm:items-center sm:flex-row">
        <div className="flex gap-2 items-center">
          <Button
            variant={viewMode === 'analytics' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setViewMode('analytics')}
            className="text-xs"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Analytics
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setViewMode('cards')}
            className="text-xs"
          >
            <Grid className="w-4 h-4 mr-1" />
            Cards
          </Button>
        </div>
        
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="flex-1 w-full max-w-md"
          />
          <Button
            variant="primary"
            onClick={() => navigate('/vendor/stores/' + storeId + '/items/new')}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Item
          </Button>
          <div className="flex flex-col items-center flex-shrink-0 h-[40px]">
            <CsvImportButton storeId={storeId!} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center mb-6">
            <div className="text-2xl font-bold tracking-tight mb-0.5">{items.length}</div>
            <div className="text-label">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="text-2xl font-bold tracking-tight mb-0.5">
              {items.filter(i => i.isActive && !i.isSoldOut).length}
            </div>
            <div className="text-label">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="text-2xl font-bold tracking-tight text-destructive mb-0.5">
              {items.filter(i => i.isSoldOut).length}
            </div>
            <div className="text-label">Sold Out</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <div className="text-2xl font-bold tracking-tight mb-0.5">
              {items.filter(i => !i.isActive).length}
            </div>
            <div className="text-label">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {viewMode === 'analytics' ? (
        <ItemAnalyticsTable
          storeId={storeId!}
          onEditItem={(itemId) => navigate(`/vendor/stores/${storeId}/items/${itemId}/edit`)}
          onDeleteItem={handleDeleteItem}
        />
      ) : (
        <>
          {paginatedList.counts.filtered === 0 ? (
            <EmptyState
              icon={Package}
              title={searchQuery ? "No items found" : "No items yet"}
              description={searchQuery ? "No items match your search criteria" : "Add your first menu item to start selling!"}
              action={
                !searchQuery && (
                  <Button variant="primary" onClick={() => navigate('/vendor/stores/' + storeId + '/items/new')}>
                    <Plus className="mr-2 w-4 h-4" />
                    Add Your First Item
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedList.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => navigate(`/vendor/stores/${storeId}/items/${item.id}/edit`)}
                    onDelete={() => handleDeleteItem(item.id, item.title)}
                    isDeleting={deleteItemMutation.isPending && deletingItemId === item.id}
                  />
                ))}
              </div>

              {paginatedList.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={paginatedList.pagination.currentPage}
                  totalItems={paginatedList.pagination.totalItems}
                  pageSize={paginatedList.pagination.pageSize}
                  onPageChange={paginatedList.pagination.goToPage}
                  showPageSize
                  pageSizeOptions={[10, 20, 50]}
                  onPageSizeChange={paginatedList.pagination.setPageSize}
                />
              )}
            </>
          )}
        </>
      )}
    </PageShell>
  )
}

// Item management card
type ItemCardProps = Readonly<{
  item: ItemResponse
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}>

function ItemCard({ item, onEdit, onDelete, isDeleting }: ItemCardProps) {
  const price = parsePrice(item.price)
  const haptics = useHaptics()

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors tap-scale active:scale-[0.98]">
      <CardHeader className="pb-3">
        <div className="flex gap-4 justify-between items-start">
          <div className="flex-1">
            <CardTitle className="mb-1 text-lg line-clamp-1">{item.title}</CardTitle>
            <span className="text-xl font-bold text-success">{formatCurrency(price)}</span>
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            {item.isActive && !item.isSoldOut && <Badge variant="success">Available</Badge>}
            {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
            {!item.isActive && <Badge variant="warning">Inactive</Badge>}
          </div>
        </div>
        {item.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {/* Placeholder for future item details (e.g., categories, options) */}
      </CardContent>

      <CardFooter className="gap-2 pt-4 mt-auto border-t border-border">
        <Button
          variant="outline"
          size="icon"
          onClick={() => { haptics.heavy(); onDelete(); }}
          disabled={isDeleting}
          className="shrink-0 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="primary" 
          className="flex-1" 
          onClick={() => { haptics.light(); onEdit(); }}
        >
          <Edit className="mr-2 w-4 h-4" />
          Edit Item
        </Button>
      </CardFooter>
    </Card>
  )
}
