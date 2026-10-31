import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { placeTarget } from '../shell/placeMemory'
import type { RecentView } from './recentViews'

export function ViewShelf({
  title,
  views,
  action,
}: {
  readonly title: string
  readonly views: readonly RecentView[]
  readonly action?: ReactNode
}) {
  const [params] = useSearchParams()
  if (views.length === 0) return null

  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="shelf-row">
        {views.map((view) => (
          <Link
            key={`${view.kind}-${view.id}`}
            to={placeTarget(view.path, params.toString())}
            className="store-tile"
          >
            {view.imageUrl ? <img src={view.imageUrl} alt="" /> : <div className="tile-fallback" />}
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{view.title}</p>
            {view.subtitle ? (
              <p className="mt-1 line-clamp-1 text-xs" style={{ color: 'var(--quiet)' }}>{view.subtitle}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  )
}
