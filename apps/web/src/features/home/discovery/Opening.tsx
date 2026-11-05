import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlaceField } from '../neighborhood/PlaceField'
import { homepageTitle, neighborhoodPath, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'
import { formatDistance } from '@shared/lib/utils/format'
import { realPhoto } from './photo'
import { NeighborhoodMap, type MapPoint } from './NeighborhoodMap'
import type { StoreTile, StoryTile } from './tiles'

export function LocationHero({
  city,
  state,
  zip,
  error,
  pending,
  story,
  nearest,
  points,
  userLat,
  userLng,
  onSelectStore,
  neighborhoods,
}: {
  readonly city?: string
  readonly state?: string
  readonly zip?: string
  readonly neighborhoods: readonly NeighborhoodCard[]
  readonly shopCount: number
  readonly error?: string
  readonly pending?: boolean
  readonly story?: StoryTile
  readonly nearest: readonly StoreTile[]
  readonly points: readonly MapPoint[]
  readonly userLat?: number
  readonly userLng?: number
  readonly onSelectStore: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const resolved = Boolean(city && state && zip && !error && !pending)
  const storyImage = story ? realPhoto(story.image) : null
  const featureStore = nearest.find((store) => store.image)
  const featureImage = featureStore?.image
  const featureArea = neighborhoods.find((area) => realPhoto(area.coverUrl))
  const featureCover = featureArea ? realPhoto(featureArea.coverUrl) : null

  return (
    <section className="discover-hero" aria-label="Shops near you">
      <div className="hero-copy">
        <h1 className="discover-display">{resolved && city && state ? homepageTitle(city, state, neighborhoods) : 'Find shops'}</h1>
        {error ? <p className="discover-lede" role="alert">{error}</p> : null}
        {pending ? <p className="discover-lede">Looking up {zip}…</p> : null}
        {resolved ? (
          <button type="button" className="location-change-btn" aria-expanded={editing} onClick={() => setEditing((open) => !open)}>
            Change ZIP
          </button>
        ) : null}
        {!resolved || editing ? <div className="mt-4 max-w-sm"><PlaceField tone="hero" /></div> : null}
        {story && storyImage ? (
          <button type="button" className="hero-story" onClick={() => story.storeId && onSelectStore(story.storeId)}>
            <img src={storyImage} alt="" className="hero-cover" />
            <strong>{story.title}</strong>
            <span>{story.body}</span>
          </button>
        ) : featureStore && featureImage ? (
          <button type="button" className="hero-story" onClick={() => onSelectStore(featureStore.id)}>
            <img src={featureImage} alt="" className="hero-cover" />
            <strong>{featureStore.name}</strong>
            <span>
              {featureStore.typeLabel}
              {featureStore.distance != undefined ? ` · ${formatDistance(featureStore.distance)}` : ''}
            </span>
          </button>
        ) : featureArea && featureCover ? (
          <Link to={neighborhoodPath(featureArea.slug)} className="hero-story">
            <img src={featureCover} alt="" className="hero-cover" />
            <strong>{featureArea.name}</strong>
            {featureArea.headline ? <span>{featureArea.headline}</span> : null}
          </Link>
        ) : null}
      </div>
      <div className="hero-map">
        <NeighborhoodMap points={points} userLat={userLat} userLng={userLng} onSelect={onSelectStore} />
      </div>
    </section>
  )
}
