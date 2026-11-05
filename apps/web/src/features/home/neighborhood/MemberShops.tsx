import { placeCardFromStore } from './PlaceCard'
import { PlaceGrid } from './PlaceGrid'

export function MemberShops({ stores }: {
  readonly stores: readonly { readonly id: string; readonly name: string; readonly typeLabel?: string; readonly image?: string; readonly distance?: number }[]
}) {
  if (stores.length === 0) return null
  return (
    <PlaceGrid
      label="Shops on Shop-Shop"
      featureFirst
      places={stores.slice(0, 8).map(placeCardFromStore)}
    />
  )
}
