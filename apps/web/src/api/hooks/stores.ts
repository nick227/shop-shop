/**
 * Store Hooks
 * 
 * React Query hooks for store operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries } from '../queries/stores'
import { mutations } from '../mutations/stores'
import type { CreateStoreInput, UpdateStoreInput } from '../adapters/validation'

/**
 * Hook for getting all stores
 */
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: queries.getAllStores,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting store by ID
 */
export function useStore(id: string) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: () => queries.getStoreById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for searching stores
 */
export function useStoreSearch(query: string) {
  return useQuery({
    queryKey: ['stores', 'search', query],
    queryFn: () => queries.searchStores(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting stores by location
 */
export function useStoresByLocation(latitude: number, longitude: number, radius?: number) {
  return useQuery({
    queryKey: ['stores', 'location', latitude, longitude, radius],
    queryFn: () => queries.getStoresByLocation(latitude, longitude, radius),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for creating store
 */
export function useCreateStore() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.createStore,
    onSuccess: () => {
      // Invalidate stores list
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

/**
 * Hook for updating store
 */
export function useUpdateStore() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStoreInput }) =>
      mutations.updateStore(id, input),
    onSuccess: (_, { id }) => {
      // Invalidate specific store and stores list
      queryClient.invalidateQueries({ queryKey: ['stores', id] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

/**
 * Hook for deleting store
 */
export function useDeleteStore() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.deleteStore,
    onSuccess: () => {
      // Invalidate stores list
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}
