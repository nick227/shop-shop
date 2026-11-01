/**
 * useVendorNav - Type-safe vendor navigation;
 */
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useNavigate } from 'react-router-dom'

export function useVendorNav() {
  const navigate = useNavigate()

  return {
    toDashboard: () => navigate('/vendor'),
    toCreateStore: () => navigate(vendorPaths.newStore),
    toEditStore: (storeId: string) => navigate(vendorPaths.settings(storeId)),
    toStoreItems: (storeId: string) => navigate(vendorPaths.menu(storeId)),
    toCreateItem: (storeId: string) => navigate(vendorPaths.newItem(storeId)),
    toEditItem: (storeId: string, itemId: string) => navigate(vendorPaths.item(storeId, itemId)),
    toHome: () => navigate('/')}
}

