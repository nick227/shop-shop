/**
 * StoreList - Wired component for displaying stores;
 * @deprecated Use StoreGrid instead for better features (sorting, filtering, highlighting)
 * 
 * This component is kept for backward compatibility but delegates to StoreGrid;
 * Migrated to Tailwind (removed CSS module)
 */
import { useStoreSearchWithTransformers } from '@shared/hooks/hooks/useStoreSearchWithTransformers'
import { StoreGrid } from '../StoreGrid'
import { Spinner } from '@shared/ui/primitives'
import type { StoreResponse, StoreWithDistance } from '@api/types'
import { useNavigate } from 'react-router-dom'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import type { AppError } from '@api/errors'
import { formatUserFacingApiError } from '@api/readHttpError'

export function StoreList() {
  const { stores, isLoading, error } = useStoreSearchWithTransformers(undefined) // No location constraint
  const navigate = useNavigate()

  const handleStoreClick = (store: StoreResponse | StoreWithDistance) => {
    navigate(getStoreRoute({ id: store.id, name: store.name }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Spinner size="large" />
        <p className="text-muted-foreground">Loading stores...</p>
      </div>
    )
  }

  if (error) {
    const details = (error as AppError).details as Record<string, unknown> | undefined
    const { message, hint } = formatUserFacingApiError(error, details)
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive"
      >
        <p className="text-sm font-semibold">Failed to load stores</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {hint ? <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{hint}</p> : null}
      </div>
    )
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">No stores available</p>
        <p className="mt-2">Check back soon for local stores near you.</p>
      </div>
    )
  }

  // Delegate to StoreGrid for better features;
  return <StoreGrid stores={stores} onStoreClick={handleStoreClick} />
}
