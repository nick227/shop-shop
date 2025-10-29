import { cn } from '@shared/lib/cn'
import { Card } from '../Card'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton loading placeholder;
 * Base primitive for creating custom loading states;
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

/**
 * SkeletonCard - Detailed loading placeholder for store/item cards;
 * Matches the structure of StoreCard for better loading UX;
 */
export function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-video bg-muted animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
        
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        </div>
        
        {/* Meta items */}
        <div className="flex gap-3 pt-1">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </Card>
  )
}

/**
 * SkeletonGrid - Grid of skeleton cards;
 * Matches StoreGrid/ItemGrid layouts;
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * SkeletonList - List of skeleton cards;
 * For vertical lists;
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

