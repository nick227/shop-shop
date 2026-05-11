import { Skeleton } from '@shared/ui/primitives'

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24 hidden sm:block" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      {/* Posts Skeleton */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Store Header */}
                <div className="flex items-center justify-between p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>

                {/* Media */}
                <div className="aspect-square bg-gray-100" />

                {/* Content */}
                <div className="p-4">
                  <div className="space-y-2 mb-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1">
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-10" />
                    </div>
                    <Skeleton className="h-10 w-10" />
                  </div>

                  {/* Stats */}
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
