/**
 * NewestStores - Display the 6 newest stores;
 */
import { useNewestStores } from '@hooks/store'
import { StoreCarousel } from '../StoreCarousel'

export function NewestStores() {
  const { data: stores, isLoading } = useNewestStores(6)

  return (
    <div className="my-8">
      <StoreCarousel
        stores={stores ?? []}
        title="🆕 Newest Stores"
        isLoading={isLoading}
      />
    </div>
  )
}

