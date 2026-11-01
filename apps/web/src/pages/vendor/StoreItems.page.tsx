/**
 * StoreItemsPage - Manage items for a specific store with sales analytics
 */
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button, SearchInput, Badge, Pagination, SegmentedControl } from '@shared/ui/primitives'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared/ui/primitives/ui/Card/Card'
import { VendorPage } from '@layouts/VendorLayout/page'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Package, Edit, Trash2, Plus } from 'lucide-react'
import { usePaginatedList } from '@shared/hooks/usePaginatedList'
import type { ItemResponse } from '@api/types'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { useHaptics } from '@shared/hooks/useHaptics'
import { ItemAnalyticsTable } from './components/ItemAnalyticsTable'
import { CsvImportButton } from './components/CsvImportButton'
import { MenuTabs } from './components/MenuTabs'

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

  return (
    <VendorPage
      title="Menu"
      loading={isLoadingStore || isLoadingItems}
      error={!isLoadingStore && !store ? { message: 'This store could not be loaded' } : undefined}
      tabs={<MenuTabs storeId={storeId!} />}
      actions={
        <>
          <CsvImportButton storeId={storeId!} />
          <Button variant="primary" onClick={() => navigate(vendorPaths.newItem(storeId!))}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add item
          </Button>
        </>
      }
    >
      <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label="Item view"
          items={[
            { id: 'analytics', label: 'Sales' },
            { id: 'cards', label: 'Cards' },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items"
            aria-label="Search items"
          />
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
          onEditItem={(itemId) => navigate(vendorPaths.item(storeId!, itemId))}
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
                  <Button variant="primary" onClick={() => navigate(vendorPaths.newItem(storeId!))}>
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
                    onEdit={() => navigate(vendorPaths.item(storeId!, item.id))}
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
      </div>
    </VendorPage>
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
