/**
 * Product Hooks
 * 
 * React Query hooks for product/item operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries } from '../queries/items'
import { mutations } from '../mutations/items'
import type { CreateItemInput, UpdateItemInput } from '../adapters/validation'

/**
 * Hook for getting all items
 */
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: queries.getAllItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting item by ID
 */
export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => queries.getItemById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting items by store ID
 */
export function useItemsByStore(storeId: string) {
  return useQuery({
    queryKey: ['items', 'store', storeId],
    queryFn: () => queries.getItemsByStoreId(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for searching items
 */
export function useItemSearch(query: string) {
  return useQuery({
    queryKey: ['items', 'search', query],
    queryFn: () => queries.searchItems(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for creating item
 */
export function useCreateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.createItem,
    onSuccess: (_, variables) => {
      // Invalidate items list and store-specific items
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items', 'store', variables.storeId] })
    },
  })
}

/**
 * Hook for updating item
 */
export function useUpdateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateItemInput }) =>
      mutations.updateItem(id, input),
    onSuccess: (_, { id }) => {
      // Invalidate specific item and related queries
      queryClient.invalidateQueries({ queryKey: ['items', id] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

/**
 * Hook for deleting item
 */
export function useDeleteItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.deleteItem,
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
