/**
 * usePaginatedList - Common handler for paginated, filtered, searchable lists
 * Combines pagination + filtering + search in one reusable hook
 */
import { useMemo } from 'react'
import { usePagination } from './usePagination'

export interface UsePaginatedListOptions<T> {
  /** Array of items to paginate */
  items: T[]
  /** Items per page (default: 20) */
  pageSize?: number
  /** Initial page (default: 1) */
  initialPage?: number
  /** Search query string */
  searchQuery?: string
  /** Fields to search in (array of field names) */
  searchFields?: (keyof T)[]
  /** Custom search function (overrides searchFields) */
  searchFn?: (item: T, query: string) => boolean
  /** Active filters object */
  filters?: Record<string, unknown>
  /** Custom filter function */
  filterFn?: (item: T, filters: Record<string, unknown>) => boolean
  /** Sort function */
  sortFn?: (a: T, b: T) => number
}

export interface PaginatedListResult<T> {
  /** Current page of items (filtered, searched, sorted) */
  items: T[]
  /** All filtered items (before pagination) */
  allFilteredItems: T[]
  /** Pagination controls */
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    goToPage: (page: number) => void
    nextPage: () => void
    previousPage: () => void
    setPageSize: (size: number) => void
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  /** Item counts */
  counts: {
    total: number
    filtered: number
    displayed: number
  }
}

/**
 * Unified hook for paginated lists with search and filtering
 * 
 * Features:
 * - Client-side pagination
 * - Search across multiple fields
 * - Custom filtering
 * - Sorting
 * - Memoized for performance
 * 
 * @example
 * ```tsx
 * const { items, pagination, counts } = usePaginatedList({
 *   items: orders,
 *   pageSize: 20,
 *   searchQuery,
 *   searchFields: ['id', 'user.name'],
 *   filters: { status: 'ACTIVE' },
 *   filterFn: (order, filters) => filters.status === 'ALL' || order.status === filters.status,
 *   sortFn: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
 * })
 * 
 * return (
 *   <>
 *     {items.map(item => <Item key={item.id} data={item} />)}
 *     <Pagination {...pagination} />
 *   </>
 * )
 * ```
 */
export function usePaginatedList<T extends Record<string, unknown>>({
  items,
  pageSize = 20,
  initialPage = 1,
  searchQuery = '',
  searchFields = [],
  searchFn,
  filters = {},
  filterFn,
  sortFn,
}: UsePaginatedListOptions<T>): PaginatedListResult<T> {
  // Apply search
  const searchedItems = useMemo(() => {
    if (!searchQuery) return items

    // Use custom search function if provided
    if (searchFn) {
      return items.filter((item) => searchFn(item, searchQuery))
    }

    // Use searchFields if provided
    if (searchFields.length > 0) {
      const query = searchQuery.toLowerCase()
      return items.filter((item) => {
        return searchFields.some((field) => {
          const value = getNestedValue(item, field as string)
          return value?.toString().toLowerCase().includes(query)
        })
      })
    }

    // Default: search all string fields
    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      return Object.values(item).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        return false
      })
    })
  }, [items, searchQuery, searchFields, searchFn])

  // Apply filters
  const filteredItems = useMemo(() => {
    if (!filterFn || Object.keys(filters).length === 0) {
      return searchedItems
    }

    return searchedItems.filter((item) => filterFn(item, filters))
  }, [searchedItems, filters, filterFn])

  // Apply sorting
  const sortedItems = useMemo(() => {
    if (!sortFn) return filteredItems

    return [...filteredItems].sort(sortFn)
  }, [filteredItems, sortFn])

  // Apply pagination
  const pagination = usePagination(sortedItems, {
    pageSize,
    initialPage,
  })

  // Calculate counts
  const counts = useMemo(() => ({
    total: items.length,
    filtered: sortedItems.length,
    displayed: pagination.currentItems.length,
  }), [items.length, sortedItems.length, pagination.currentItems.length])

  return {
    items: pagination.currentItems,
    allFilteredItems: sortedItems,
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalItems: sortedItems.length,
      pageSize: pagination.pageSize,
      goToPage: pagination.goToPage,
      nextPage: pagination.nextPage,
      previousPage: pagination.previousPage,
      setPageSize: pagination.setPageSize,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
    },
    counts,
  }
}

/**
 * Helper to get nested object values
 * Supports dot notation: 'user.name', 'order.store.name'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return
  }, obj)
}

