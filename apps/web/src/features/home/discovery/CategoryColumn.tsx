import { useSearchParams } from 'react-router-dom'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'

export function CategoryColumn() {
  const [params, setParams] = useSearchParams()
  const active = params.get('browse') ?? ''

  const choose = (slug: string) => {
    const next = new URLSearchParams(params)
    if (slug) next.set('browse', slug)
    else next.delete('browse')
    setParams(next, { replace: true })
  }

  return (
    <nav className="discover-cats" aria-label="Shop by type">
      <p className="tile-kicker">Browse</p>
      {STORE_TYPE_CONFIG.map(({ slug, label, Icon }) => {
        const pressed = active === slug
        return (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            className={pressed ? 'is-on' : undefined}
            onClick={() => choose(slug)}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
