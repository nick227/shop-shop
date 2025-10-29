/**
 * StoreList - Wired component for displaying stores;
 * @deprecated Use StoreGrid instead for better features (sorting, filtering, highlighting)
 * 
 * This component is kept for backward compatibility but delegates to StoreGrid;
 * Migrated to Tailwind (removed CSS module)
 */
import { useStores } from '@api/hooks/generated'
import { StoreGrid } from '../StoreGrid'
import { Spinner } from '@shared/ui/primitives'
import type { StoreResponse, StoreWithDistance } from '@api/backend-types'
import { useNavigate } from 'react-router-dom'

export function StoreList() {
  const { data: stores, isLoading, error } = useStores()
  const navigate = useNavigate()

  const handleStoreClick = (store: StoreResponse | StoreWithDistance) => {
    navigate(`/stores/${store.id}`)
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

  if (!stores) {
    return null;
  }

  // Delegate to StoreGrid for better features;
  return <StoreGrid stores={stores} onStoreClick={handleStoreClick} />
}

