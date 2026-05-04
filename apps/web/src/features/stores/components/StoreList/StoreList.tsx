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

export function StoreList() {
  const { stores, isLoading, error } = useStoreSearchWithTransformers(undefined) // No location constraint
  const navigate = useNavigate()

  const handleStoreClick = (store: StoreResponse | StoreWithDistance) => {
    navigate(`/store/${store.id}`)
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
    return (
      <div className="text-red-600 p-4 text-center">
        <p>Failed to load stores: {error.message}</p>
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
