/**
 * VendorPage — the page contract for every seller page.
 * Pages pass content; the contract owns width, header, tabs, spacing, and loading/error states.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Button, Skeleton } from '@shared/ui/primitives'

export interface Breadcrumb {
  readonly label: string
  readonly to?: string
}

interface VendorPageProps {
  /** The nav label, exactly. Never repeats the store name. */
  readonly title: string
  readonly description?: ReactNode
  /** Nested pages only. */
  readonly breadcrumbs?: readonly Breadcrumb[]
  /** Secondary actions first, then at most one primary. */
  readonly actions?: ReactNode
  readonly tabs?: ReactNode
  /** Wide for lists and boards, narrow for forms, full for editors built around a preview. */
  readonly width?: 'wide' | 'narrow' | 'full'
  readonly loading?: boolean
  readonly error?: { readonly message: string; readonly onRetry?: () => void }
  readonly children?: ReactNode
}

const WIDTH = { wide: 'max-w-6xl', narrow: 'max-w-3xl', full: 'max-w-none' } as const

function PageSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}

function PageError({ message, onRetry }: { readonly message: string; readonly onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-border p-6">
      <p className="text-sm font-semibold">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection, then try again.</p>
      {onRetry ? (
        <Button variant="outline" size="small" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function VendorPage({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  width = 'wide',
  loading = false,
  error,
  children,
}: VendorPageProps) {
  return (
    <div className={cn('mx-auto w-full px-4 pb-16 pt-5 md:px-8 md:pt-8', WIDTH[width])}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {breadcrumbs?.length ? (
            <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.label} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          {/* Below lg the top bar shows the title, so the heading stays for screen readers only. */}
          <h1 className="sr-only text-2xl font-semibold tracking-tight lg:not-sr-only">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground lg:mt-1">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      {tabs ? <div className="mt-6">{tabs}</div> : null}

      <div className="mt-6">
        {loading ? <PageSkeleton /> : null}
        {!loading && error ? <PageError message={error.message} onRetry={error.onRetry} /> : null}
        {loading || error ? null : children}
      </div>
    </div>
  )
}
