import { Sparkles, Trees } from 'lucide-react'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { recordVertical } from '../neighborhood/taste'
import { useBrowseChoice } from '../shell/BrowseNav'

const EXTRA_DISCOVERY_CATEGORIES = [
  { value: 'ARTS', slug: 'arts', label: 'Arts', Icon: Sparkles },
  { value: 'OUTDOORS', slug: 'outdoors', label: 'Outdoors', Icon: Trees },
] as const

const ALL_DISCOVERY_CATEGORIES = [...STORE_TYPE_CONFIG, ...EXTRA_DISCOVERY_CATEGORIES]

export function CategoryCircles() {
  const { active, choose } = useBrowseChoice()
  return (
    <div className="circle-row" role="group" aria-label="Shop by type">
      {ALL_DISCOVERY_CATEGORIES.map(({ slug, label, Icon }) => {
        const pressed = active === slug
        return (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            className={pressed ? 'circle-cat is-on' : 'circle-cat'}
            onClick={() => {
              if (slug) recordVertical(slug)
              choose(slug)
            }}
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
    <section className="surface-band" aria-label="Categories">
      <div className="surface-head">
        <div>
          <p className="tile-kicker">Browse Categories</p>
          <h2 className="surface-title">Jump to a category</h2>
        </div>
        <p className="surface-note">Food, grocery, convenience, retail, arts, and outdoors.</p>
      </div>
      <CategoryCircles />
    </section>
  )
}
