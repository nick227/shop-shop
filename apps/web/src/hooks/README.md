# SDK-First Hook Patterns

This directory contains standardized hook patterns for the SDK-first architecture, ensuring consistency, reliability, and maintainability across all API interactions.

## 🎯 **Core Principles**

### 1. **SDK-First Architecture**
- All hooks use `@api/types` instead of direct SDK imports
- Centralized type management through `api/types.ts`
- Consistent error handling and retry strategies

### 2. **Standardized Patterns**
- Consistent naming conventions (`use[Entity]`, `use[Entity]With[Extension]`)
- Standardized error handling with user-friendly messages
- Consistent retry strategies and caching policies

### 3. **Computed Fields**
- Clear extension patterns for adding computed fields
- Performance-optimized with `useMemo`
- Reusable computation utilities

## 📁 **Directory Structure**

```
hooks/
├── templates/           # Standardized hook templates
│   ├── useEntity.ts                    # Basic CRUD hook template
│   └── useEntityWithExtensions.ts      # Extension patterns template
├── utils/              # Shared utilities
│   └── errorHandling.ts               # Error handling utilities
├── [entity]/           # Entity-specific hooks
│   ├── use[Entity].ts                 # Basic entity hooks
│   └── use[Entity]With[Extension].ts  # Extended entity hooks
└── README.md           # This file
```

## 🔧 **Hook Templates**

### **Basic Entity Hook (`useEntity.ts`)**

```typescript
// ✅ Standard pattern for all entity hooks
export function useEntity(id: string, options?: QueryOptions) {
  return useQuery<EntityResponse, any>({
    queryKey: ['entity', id],
    queryFn: async () => {
      try {
        return await apiClient.entities().getEntity({ entityId: id })
      } catch (error: any) {
        throw await createQueryErrorHandler()(error)
      }
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryRetryConfig
  })
}
```

### **Entity with Computed Fields (`useEntityWithExtensions.ts`)**

```typescript
// ✅ Pattern for extending entities with computed fields
export function useEntityWithComputed(
  entity: EntityResponse,
  options?: { includeDistance?: boolean; includeRating?: boolean }
) {
  return useMemo(() => {
    let computed = { ...entity }
    
    if (options?.includeDistance) {
      computed = {
        ...computed,
        distance: computeDistance(computed),
        isNearby: computed.distance < 5
      }
    }
    
    return computed
  }, [entity, options])
}
```

## 🚨 **Error Handling**

### **Consistent Error Processing**

All hooks use the standardized error handling system:

```typescript
import { 
  createQueryErrorHandler, 
  createMutationErrorHandler, 
  createMutationOnError,
  queryRetryConfig,
  mutationRetryConfig 
} from './utils/errorHandling'

// For queries
const query = useQuery({
  queryFn: async () => {
    try {
      return await apiClient.entities().getEntity({ entityId: id })
    } catch (error: any) {
      throw await createQueryErrorHandler()(error)
    }
  },
  ...queryRetryConfig
})

// For mutations
const mutation = useMutation({
  mutationFn: async (input) => {
    try {
      return await apiClient.entities().createEntity({ createEntityRequest: input })
    } catch (error: any) {
      throw await createMutationErrorHandler()(error)
    }
  },
  onError: createMutationOnError(),
  ...mutationRetryConfig
})
```

### **Error Categories**

The error handling system categorizes errors for appropriate handling:

- **Network**: Connection issues, timeouts
- **Validation**: Input validation errors
- **Authentication**: Login required
- **Authorization**: Permission denied
- **Not Found**: Resource not found
- **Server**: Server-side errors

## 🎨 **Computed Fields Patterns**

### **Extension Types**

```typescript
// ✅ Clear extension naming
export interface StoreWithLocation extends StoreResponse {
  distance?: number
  fullAddress?: string
  coordinates?: { lat: number; lng: number }
  isWithinDeliveryRadius?: boolean
}

export interface StoreWithMetrics extends StoreResponse {
  averageRating?: number
  ratingCount?: number
  revenue?: { daily: number; weekly: number; monthly: number }
}
```

### **Computation Utilities**

```typescript
// ✅ Reusable computation utilities
export const locationUtils = {
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // Haversine formula implementation
  },
  formatAddress: (address: AddressComponents): string => {
    // Address formatting logic
  }
}
```

### **Performance Optimization**

```typescript
// ✅ Memoized computed fields
export function useStoreWithLocation(store: StoreResponse, userLocation?: Location) {
  return useMemo(() => {
    // Expensive computations here
    return computeLocationFields(store, userLocation)
  }, [store, userLocation]) // Only recompute when dependencies change
}
```

## 📋 **Implementation Guidelines**

### **1. Naming Conventions**

- **Basic hooks**: `use[Entity]` (e.g., `useStore`, `useOrder`)
- **Extended hooks**: `use[Entity]With[Extension]` (e.g., `useStoreWithLocation`)
- **Utility hooks**: `use[Function]` (e.g., `useErrorHandler`)

### **2. Type Safety**

- Always use `@api/types` for SDK types
- Create extension interfaces for computed fields
- Use proper TypeScript generics for reusability

### **3. Error Handling**

- Use standardized error handlers
- Provide user-friendly error messages
- Implement appropriate retry strategies

### **4. Performance**

- Use `useMemo` for expensive computations
- Implement proper dependency arrays
- Consider debouncing for real-time updates

### **5. Caching Strategy**

- Use appropriate `staleTime` for different data types
- Implement proper cache invalidation
- Consider background refetching for critical data

## 🚀 **Creating New Hooks**

### **Step 1: Create Basic Hook**

```typescript
// hooks/useNewEntity.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { createQueryErrorHandler, createMutationErrorHandler, createMutationOnError, queryRetryConfig, mutationRetryConfig } from './utils/errorHandling'
import type { NewEntityResponse, CreateNewEntityInput, UpdateNewEntityInput } from '@api/types'

export function useNewEntity(id: string) {
  return useQuery<NewEntityResponse, any>({
    queryKey: ['newEntity', id],
    queryFn: async () => {
      try {
        return await apiClient.newEntities().getNewEntity({ newEntityId: id })
      } catch (error: any) {
        throw await createQueryErrorHandler()(error)
      }
    },
    enabled: Boolean(id),
    ...queryRetryConfig
  })
}
```

### **Step 2: Add Computed Fields (if needed)**

```typescript
// hooks/useNewEntityWithComputed.ts
import { useMemo } from 'react'
import type { NewEntityResponse } from '@api/types'

export interface NewEntityWithComputed extends NewEntityResponse {
  computedField?: string
  isActive?: boolean
}

export function useNewEntityWithComputed(entity: NewEntityResponse) {
  return useMemo(() => {
    return {
      ...entity,
      computedField: computeField(entity),
      isActive: entity.status === 'active'
    }
  }, [entity])
}
```

### **Step 3: Add to Exports**

```typescript
// hooks/index.ts
export * from './useNewEntity'
export * from './useNewEntityWithComputed'
```

## 🔍 **Testing Hooks**

### **Unit Testing**

```typescript
// hooks/__tests__/useNewEntity.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNewEntity } from '../useNewEntity'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

test('should fetch new entity', async () => {
  const { result } = renderHook(() => useNewEntity('test-id'), {
    wrapper: createWrapper()
  })

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
})
```

## 📚 **Best Practices**

1. **Always use the templates** as starting points
2. **Follow naming conventions** consistently
3. **Implement proper error handling** for all API calls
4. **Use computed fields** for derived data
5. **Optimize performance** with memoization
6. **Write comprehensive tests** for all hooks
7. **Document complex logic** with clear comments
8. **Keep hooks focused** on single responsibilities

## 🎯 **Migration Guide**

When updating existing hooks to follow new patterns:

1. **Update imports** to use `@api/types`
2. **Replace error handling** with standardized utilities
3. **Add retry configurations** for better reliability
4. **Extract computed fields** into separate hooks
5. **Update tests** to match new patterns
6. **Document changes** for team awareness

This standardized approach ensures consistency, maintainability, and developer productivity across the entire codebase.
