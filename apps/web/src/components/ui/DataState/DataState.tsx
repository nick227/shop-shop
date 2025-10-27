import type { ReactNode } from 'react'
import { SkeletonList } from '@ui/Skeleton'
import { Button } from '@ui'
import { AlertCircle, Inbox } from 'lucide-react'

/**
 * DataState - Modern data state handler with Tailwind
 * Declarative loading/error/empty states
 */

export interface DataStateProps<T> {
  data: T[] | undefined | undefined
  isLoading: boolean
  error: Error | undefined | undefined
  children: (data: T[]) => ReactNode
  emptyMessage?: string
  errorMessage?: string
  loadingMessage?: string
  skeletonCount?: number
  onRetry?: () => void
}

export function DataState<T>({
  data,
  isLoading,
  error,
  children,
  emptyMessage = 'No items found',
  errorMessage,
  loadingMessage = 'Loading...',
  skeletonCount = 3,
  onRetry,
}: DataStateProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {loadingMessage && (
          <p className="text-muted-foreground text-center">{loadingMessage}</p>
        )}
        <SkeletonList count={skeletonCount} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground mb-4">
          {errorMessage || error.message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  // Success state
  return <>{children(data)}</>
}

