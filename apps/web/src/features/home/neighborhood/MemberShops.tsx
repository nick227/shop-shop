import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { PlaceGrid } from './PlaceGrid'

export function MemberShops({ stores }: {
  readonly stores: readonly { readonly id: string; readonly name: string; readonly typeLabel?: string; readonly image?: string; readonly distance?: number }[]
}) {
  if (stores.length === 0) return null
  return (
    <PlaceGrid
      label="Shops on Shop-Shop"
      featureFirst
      places={stores.slice(0, 8).map((store) => ({
        id: store.id,
        href: getStoreRoute({ id: store.id, name: store.name }),
        name: store.name,
        categoryLabel: store.typeLabel ?? 'Shop',
        meta: store.distance == null ? null : `${store.distance.toFixed(1)} mi`,
        imageUrl: store.image ?? null,
      }))}
    />
  )
}
