/**
 * StoreItemsPage - Manage items for a specific store
 */
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { Button, SearchInput, Badge, Spinner, Pagination } from '@shared/ui/primitives'
import { usePaginatedList } from '@shared/hooks/usePaginatedList'
import type { ItemResponse } from '@api/backend-types'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'

export default function StoreItemsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

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
    queryKey: ['items', storeId],
    queryFn: async () => {
      return await apiClient.items().listItems({
        // Note: SDK doesn't support storeId filtering yet
        // All items will be returned and filtered client-side
      })
    },
    enabled: !!storeId,
  })

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiClient.items().deleteItem({ id: itemId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', storeId] })
      toast.success('Item deleted successfully!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  // Filter items by storeId since SDK doesn't support server-side filtering
  const items = (itemsData?.data ?? []).filter(item => item.storeId === storeId) as ItemResponse[]

  // Unified pagination handler with search
  const paginatedList = usePaginatedList({
    items: items,
    pageSize: 20,
    searchQuery,
    searchFields: ['title', 'description'],
  })

  const handleDeleteItem = useCallback((itemId: string, itemTitle: string) => {
    if (confirm('Are you sure you want to delete "' + itemTitle + '"?')) {
      deleteItemMutation.mutate(itemId)
    }
  }, [deleteItemMutation])

  if (isLoadingStore || isLoadingItems) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Spinner size="large" />
        <p className="text-gray-600">Loading store items...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <h2 className="text-2xl font-bold text-red-600">Store not found</h2>
        <Button variant="primary" onClick={() => navigate('/vendor/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 {store.name} - Menu Items</h1>
          <p className="text-gray-600">Manage your menu items</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/vendor/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Actions Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-3 items-center">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="flex-1 max-w-md"
        />
        <Button
          variant="primary"
          onClick={() => navigate('/vendor/stores/' + storeId + '/items/new')}
        >
          + Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">{items.length}</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Total Items</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {items.filter(i => i.isActive && !i.isSoldOut).length}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Available</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-red-600 mb-1">
            {items.filter(i => i.isSoldOut).length}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Sold Out</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {items.filter(i => !i.isActive).length}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Inactive</div>
        </div>
      </div>

      {/* Items List */}
      {paginatedList.counts.filtered === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-12 bg-white rounded-lg border border-gray-200">
          {searchQuery ? (
            <>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-600">No items match your search criteria</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Add your first menu item to start selling!</p>
              <Button
                variant="primary"
                onClick={() => navigate('/vendor/stores/' + storeId + '/items/new')}
              >
                Add Your First Item
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginatedList.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => navigate(`/vendor/stores/${storeId}/items/${item.id}/edit`)}
                onDelete={() => handleDeleteItem(item.id, item.title)}
                isDeleting={deleteItemMutation.isPending}
              />
            ))}
          </div>

          {paginatedList.pagination.totalPages > 1 && (
            <div className="max-w-7xl mx-auto">
              <Pagination
                currentPage={paginatedList.pagination.currentPage}
                totalItems={paginatedList.pagination.totalItems}
                pageSize={paginatedList.pagination.pageSize}
                onPageChange={paginatedList.pagination.goToPage}
                showPageSize
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={paginatedList.pagination.setPageSize}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Item management card
interface ItemCardProps {
  item: ItemResponse
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function ItemCard({ item, onEdit, onDelete, isDeleting }: ItemCardProps) {
  const price = parsePrice(item.price)

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-300 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
          <span className="text-xl font-semibold text-green-600">{formatCurrency(price)}</span>
        </div>
        <div className="flex gap-2">
          {item.isActive && !item.isSoldOut && (
            <Badge variant="success">Available</Badge>
          )}
          {item.isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
          {!item.isActive && <Badge variant="warning">Inactive</Badge>}
        </div>
      </div>

      {item.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          size="small"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex-1"
        >
          🗑️ Delete
        </Button>
        <Button variant="primary" size="small" onClick={onEdit} className="flex-1">
          ✏️ Edit
        </Button>
      </div>
    </div>
  )
}

