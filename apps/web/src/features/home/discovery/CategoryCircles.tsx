import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { useBrowseChoice } from '../shell/BrowseNav'

export function CategoryCircles() {
  const { active, choose } = useBrowseChoice()
  return (
    <div className="circle-row" role="group" aria-label="Shop by type">
      {STORE_TYPE_CONFIG.map(({ slug, label, Icon }) => {
        const pressed = active === slug
        return (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            className={pressed ? 'circle-cat is-on' : 'circle-cat'}
            onClick={() => choose(slug)}
          >
            <span className="circle-mark"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function CategorySection() {
  return (
    <section className="place-band" aria-label="Categories">
      <p className="tile-kicker">Browse by category</p>
      <CategoryCircles />
    </section>
  )
}
