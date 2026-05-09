/**
 * useVendorNav - Type-safe vendor navigation;
 */
import { useNavigate } from 'react-router-dom'

export function useVendorNav() {
  const navigate = useNavigate()

  return {
    toDashboard: () => navigate('/vendor/dashboard'),
    toCreateStore: () => navigate('/vendor/store/new'),
    toEditStore: (storeId: string) => navigate('/vendor/stores/' + storeId + '/edit'),
    toStoreItems: (storeId: string) => navigate('/vendor/stores/' + storeId + '/items'),
    toCreateItem: (storeId: string) => navigate('/vendor/stores/' + storeId + '/items/new'),
    toEditItem: (storeId: string, itemId: string) => 
      navigate(`/vendor/stores/${storeId}/items/${itemId}/edit`),
    toHome: () => navigate('/')}
}

