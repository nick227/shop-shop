/**
 * usePagination Hook - Client-side pagination logic;
 * Slices data array into pages and provides navigation;
 */
import { useMemo, useState, useCallback } from 'react'

export interface UsePaginationOptions {
  /** Items per page (default: 20) */
  pageSize?: number;
  /** Initial page (default: 1) */
  initialPage?: number;
}

export interface PaginationResult<T> {
  /** Current page of items */
  currentItems: T[]
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Check if has next page */
  hasNextPage: boolean;
  /** Check if has previous page */
  hasPreviousPage: boolean;
}

/**
 * Client-side pagination hook;
 * Efficiently paginates array data with memoization;
 * 
 * @example;
 * ```tsx;
 * const { 
 *   currentItems, 
 *   currentPage, 
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   previousPage;
 * } = usePagination(orders, { pageSize: 20 })
 * 
 * return (
 *   <>
 *     {currentItems.map(item => <Item key={item.id} data={item} />)}
 *     <Pagination;
 *       currentPage={currentPage}
 *       totalItems={orders.length}
 *       pageSize={20}
 *       onPageChange={goToPage}
 *     />
 *   </>
 * )
 * ```
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): PaginationResult<T> {
  const { pageSize: initialPageSize = 20, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize)

  // Clamp current page to valid range;
  const validPage = useMemo(() => {
    if (currentPage < 1) return 1;
    if (currentPage > totalPages) return totalPages || 1;
    return currentPage;
  }, [currentPage, totalPages])

  // Get current page items;
  const currentItems = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex)
  }, [items, validPage, pageSize])

  // Navigation functions;
  const goToPage = useCallback((page: number) => {
    const clampedPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(clampedPage)
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing size;
  }, [])

  return {
    currentItems,
    currentPage: validPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: changePageSize,
    hasNextPage: validPage < totalPages,
    hasPreviousPage: validPage > 1}
}

