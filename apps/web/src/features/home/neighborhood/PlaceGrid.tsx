import { PlaceCard, type PlaceCardData } from './PlaceCard'

export function PlaceGrid({
  places,
  label,
  featureFirst = false,
}: {
  readonly places: readonly PlaceCardData[]
  readonly label: string
  readonly featureFirst?: boolean
}) {
  if (places.length === 0) return null
  return (
    <section className="place-band" aria-label={label}>
      <p className="tile-kicker">{label}</p>
      <div className="place-mosaic">
        {places.map((place, index) => (
          <PlaceCard key={place.id} place={place} feature={featureFirst && index === 0} />
        ))}
      </div>
    </section>
  )
}

export function PlaceSkeleton() {
  return (
    <div className="place-mosaic" aria-hidden>
      {['a', 'b', 'c', 'd'].map((key) => <div key={key} className="place-card place-skeleton" />)}
    </div>
  )
}
