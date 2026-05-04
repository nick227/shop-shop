// @ts-nocheck
/**
 * Standardized Hook Template - SDK-First Architecture
 * 
 * This template provides consistent patterns for all SDK-based hooks:
 * 1. Consistent error handling with handleApiError
 * 2. Standardized query/mutation patterns
 * 3. Type-safe API client usage
 * 4. Consistent return interfaces
 * 5. Proper invalidation strategies
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { handleApiError, type AppError } from '@api/errors'
import type { 
  EntityResponse, 
  CreateEntityInput, 
  UpdateEntityInput,
  EntityListResponse 
} from '@api/types'

// ============================================
// Query Hooks
// ============================================

/**
 * useEntity - Fetch single entity by ID
 * @param id - Entity ID
 * @param options - Query options
 */
export function useEntity(
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number
  }
) {
  return useQuery<EntityResponse, AppError>({
    queryKey: ['entity', id],
    queryFn: async () => {
      try {
        return await apiClient.entities().getEntity({ entityId: id })
      } catch (error: unknown) {
        throw await handleApiError(error)
      }
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * useEntities - Fetch list of entities
 * @param params - Query parameters
 * @param options - Query options
 */
export function useEntities(
  params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  },
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number
  }
) {
  return useQuery<EntityListResponse, AppError>({
    queryKey: ['entities', params],
    queryFn: async () => {
      try {
        return await apiClient.entities().listEntities({
          listEntitiesRequest: params ?? {}
        })
      } catch (error: unknown) {
        throw await handleApiError(error)
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 minutes
    refetchInterval: options?.refetchInterval,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * useCreateEntity - Create new entity
 */
export function useCreateEntity() {
  const queryClient = useQueryClient()

  return useMutation<EntityResponse, AppError, CreateEntityInput>({
    mutationFn: async (input) => {
      try {
        return await apiClient.entities().createEntity({
          createEntityRequest: input
        })
      } catch (error: unknown) {
        throw await handleApiError(error)
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch entities list
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      
      // Optionally add the new entity to cache
      queryClient.setQueryData(['entity', data.id], data)
    },
  })
}

/**
 * useUpdateEntity - Update existing entity
 */
export function useUpdateEntity() {
  const queryClient = useQueryClient()

  return useMutation<EntityResponse, AppError, { id: string; input: UpdateEntityInput }>({
    mutationFn: async ({ id, input }) => {
      try {
        return await apiClient.entities().updateEntity({
          entityId: id,
          updateEntityRequest: input
        })
      } catch (error: unknown) {
        throw await handleApiError(error)
      }
    },
    onSuccess: (data, variables) => {
      // Update the specific entity in cache
      queryClient.setQueryData(['entity', variables.id], data)
      
      // Invalidate entities list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

/**
 * useDeleteEntity - Delete entity
 */
export function useDeleteEntity() {
  const queryClient = useQueryClient()

  return useMutation<void, AppError, string>({
    mutationFn: async (id) => {
      try {
        await apiClient.entities().deleteEntity({ entityId: id })
      } catch (error: unknown) {
        throw await handleApiError(error)
      }
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['entity', id] })
      
      // Invalidate entities list
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

// ============================================
// Computed Field Hooks
// ============================================

/**
 * useEntityWithComputed - Entity with computed fields
 * This demonstrates the extension pattern for computed fields
 */
export function useEntityWithComputed(
  id: string,
  options?: {
    enabled?: boolean
    includeDistance?: boolean
    includeRating?: boolean
  }
) {
  const entityQuery = useEntity(id, options)
  
  // Add computed fields based on options
  const computedData = useMemo(() => {
    if (!entityQuery.data) return
    
    let computed = { ...entityQuery.data }
    
    // Add computed fields based on options
    if (options?.includeDistance) {
      computed = {
        ...computed,
        distance: computeDistance(computed),
        isNearby: (computed).distance < 5
      }
    }
    
    if (options?.includeRating) {
      computed = {
        ...computed,
        averageRating: computeAverageRating(computed),
        ratingCount: computeRatingCount(computed)
      }
    }
    
    return computed
  }, [entityQuery.data, options])
  
  return {
    ...entityQuery,
    data: computedData
  }
}

// ============================================
// Helper Functions for Computed Fields
// ============================================

function computeDistance(entity: EntityResponse): number {
  // Implementation for distance calculation
  return 0 // Placeholder
}

function computeAverageRating(entity: EntityResponse): number {
  // Implementation for rating calculation
  return 0 // Placeholder
}

function computeRatingCount(entity: EntityResponse): number {
  // Implementation for rating count
  return 0 // Placeholder
}
