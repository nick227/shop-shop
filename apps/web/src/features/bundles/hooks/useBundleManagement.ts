/**
 * Bundle Management Hook
 * High-performance implementation with cached calculations and memoized operations
 */
import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { 
  useBundles, 
  useCreateBundle, 
  useUpdateBundle, 
  useDeleteBundle 
} from '@api/hooks/generated'
import { formDataToCreateInput, formDataToUpdateInput } from '../types/bundle.types'
import type { Bundle } from '@api/backend-types'
import type { CreateBundleInput } from '@api/apiWrapper'
import type { BundleFormData, BundleManagementOptions } from '../types/bundle.types'

// Type alias for update operations (uses same structure as create)
type UpdateBundleInput = Partial<CreateBundleInput>

export function useBundleManagement(options: BundleManagementOptions = {}) {
  const { storeId, isActive = true } = options
  const queryClient = useQueryClient()

  // Direct SDK hooks
  const bundlesQuery = useBundles({ storeId, isActive })
  const createBundleMutation = useCreateBundle()
  const updateBundleMutation = useUpdateBundle()
  const deleteBundleMutation = useDeleteBundle()

  // Memoized bundle data with computed fields
  const bundleData = useMemo(() => {
    const bundles = bundlesQuery.data || []
    
    // Single-pass calculation for active/inactive counts
    let activeCount = 0
    let inactiveCount = 0
    const activeBundles: Bundle[] = []
    const inactiveBundles: Bundle[] = []
    
    for (const bundle of bundles) {
      if (bundle.isActive) {
        activeCount++
        activeBundles.push(bundle)
      } else {
        inactiveCount++
        inactiveBundles.push(bundle)
      }
    }
    
    return {
      bundles,
      activeBundles,
      inactiveBundles,
      activeCount,
      inactiveCount
    }
  }, [bundlesQuery.data])

  // Memoized create handler with error handling
  const createBundle = useCallback(async (formData: BundleFormData) => {
    if (!storeId) throw new Error('Store ID is required')
    
    const input = formDataToCreateInput(formData, storeId)
    return createBundleMutation.mutateAsync(input, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bundles'] })
      }
    })
  }, [storeId, createBundleMutation, queryClient])

  // Memoized update handler
  const updateBundle = useCallback(async (id: string, formData: Partial<BundleFormData>) => {
    const input = formDataToUpdateInput(formData)
    return updateBundleMutation.mutateAsync({ id, input: input as Partial<CreateBundleInput> }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bundles'] })
        queryClient.invalidateQueries({ queryKey: ['bundle', id] })
      }
    })
  }, [updateBundleMutation, queryClient])

  // Memoized delete handler
  const deleteBundle = useCallback(async (id: string) => {
    return deleteBundleMutation.mutateAsync(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bundles'] })
        queryClient.removeQueries({ queryKey: ['bundle', id] })
      }
    })
  }, [deleteBundleMutation, queryClient])

  // Memoized toggle handler
  const toggleBundleStatus = useCallback(async (id: string, isActive: boolean) => {
    return updateBundle(id, { isActive })
  }, [updateBundle])

  // Memoized bundle finder
  const findBundle = useCallback((id: string) => {
    return bundleData.bundles.find(b => b.id === id)
  }, [bundleData.bundles])

  // Memoized bundle search
  const searchBundles = useCallback((searchTerm: string) => {
    if (!searchTerm) return bundleData.bundles
    
    const searchLower = searchTerm.toLowerCase()
    return bundleData.bundles.filter(bundle => 
      bundle.name.toLowerCase().includes(searchLower) ||
      bundle.description?.toLowerCase().includes(searchLower)
    )
  }, [bundleData.bundles])

  // Memoized bundle filter
  const filterBundles = useCallback((
    searchTerm: string, 
    statusFilter: 'all' | 'active' | 'inactive'
  ) => {
    let filtered = bundleData.bundles
    
    // Apply status filter first (most selective)
    if (statusFilter !== 'all') {
      filtered = statusFilter === 'active' ? bundleData.activeBundles : bundleData.inactiveBundles
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(bundle => 
        bundle.name.toLowerCase().includes(searchLower) ||
        bundle.description?.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }, [bundleData.bundles, bundleData.activeBundles, bundleData.inactiveBundles])

  return {
    // Data
    bundles: bundleData.bundles,
    activeBundles: bundleData.activeBundles,
    inactiveBundles: bundleData.inactiveBundles,
    activeCount: bundleData.activeCount,
    inactiveCount: bundleData.inactiveCount,
    
    // Query state
    isLoading: bundlesQuery.isLoading,
    error: bundlesQuery.error,
    refetch: bundlesQuery.refetch,
    
    // Actions
    createBundle,
    updateBundle,
    deleteBundle,
    toggleBundleStatus,
    
    // Utilities
    findBundle,
    searchBundles,
    filterBundles,
    
    // Loading states
    isCreating: createBundleMutation.isPending,
    isUpdating: updateBundleMutation.isPending,
    isDeleting: deleteBundleMutation.isPending,
    
    // Type transformers
    formDataToCreateInput,
    formDataToUpdateInput
  }
}
