import { Link, useSearchParams } from 'react-router-dom'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { recordVertical } from './taste'

const HINTS: Record<string, string> = {
  food: 'Kitchens, bakeries, coffee',
  grocery: 'Markets and produce',
  convenience: 'The corner, open late',
  retail: 'Shops that deliver',
}

export function TypePlates() {
  const [params] = useSearchParams()
  const plates = STORE_TYPE_CONFIG.filter((type) => type.slug)

  return (
    <section aria-label="Shop by type">
      <div className="section-head">
        <h2 className="shop-display">What do you need?</h2>
      </div>
      <div className="plate-grid">
        {plates.map((plate) => {
          const next = new URLSearchParams(params)
          next.set('browse', plate.slug)
          next.delete('q')
          const wide = plate.slug === 'food' || plate.slug === 'retail'
          const className = plate.slug === 'food' ? 'plate plate-food' : wide ? 'plate plate-wide' : 'plate'
          return (
            <Link
              key={plate.slug}
              to={{ pathname: '/search', search: next.toString() }}
              className={className}
              onClick={() => recordVertical(plate.slug)}
            >
              <strong className="shop-display">{plate.label}</strong>
              <span>{HINTS[plate.slug]}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
