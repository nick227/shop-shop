/**
 * Pagination Component - Reusable pagination controls;
 * Migrated to Tailwind (removed CSS module)
 */
import { useMemo } from 'react'
import { Button } from '../Button'
import { cn } from '@shared/lib/cn'

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Page size options */
  pageSizeOptions?: number[]
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pagination controls with page numbers and navigation;
 * 
 * @example;
 * ```tsx;
 * <Pagination;
 *   currentPage={page}
 *   totalItems={orders.length}
 *   pageSize={20}
 *   onPageChange={setPage}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  showPageSize = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  className = ''}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  
  // Calculate visible page numbers;
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small;
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page;
      pages.push(1)
      
      // Calculate range around current page;
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      // Add ellipsis after first page if needed;
      if (start > 2) {
        pages.push('...')
      }
      
      // Add pages around current;
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed;
      if (end < totalPages - 1) {
        pages.push('...')
      }
      
      // Always show last page;
      pages.push(totalPages)
    }
    
    return pages;
  }, [currentPage, totalPages])

  if (totalPages <= 1) {
    return;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-4', className)}>
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="small"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={'ellipsis-' + index + ''} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={page}
                className={cn(
                  'min-w-[2.5rem] h-10 px-3 rounded-md text-sm font-medium transition-colors tap-scale',
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
                onClick={() => onPageChange(page as number)}
                aria-label={'Page ' + page + ''}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <Button
          variant="ghost"
          size="small"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next →
        </Button>
      </div>

      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="page-size" className="text-muted-foreground">Per page:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-input rounded-md bg-background"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

