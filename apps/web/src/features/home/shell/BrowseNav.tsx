import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { cn } from '@shared/lib/cn'
import { applyDiscoveryPatch, readDiscoveryContext } from '../discovery/discoveryContext'

export function useBrowseChoice() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const context = readDiscoveryContext(pathname, params.toString())
  const active = context.category

  const choose = (slug: string) => {
    navigate(applyDiscoveryPatch(pathname, params.toString(), { category: slug || null }))
  }

  return { active, choose }
}

export function BrowseNav({ expanded }: { readonly expanded: boolean }) {
  const { active, choose } = useBrowseChoice()

  return (
    <div className="shop-browse" role="group" aria-label="Shop by type">
      <p className={cn('shop-mono px-3 pt-3 text-[0.65rem] uppercase tracking-wide', expanded ? undefined : 'shop-rail-label')} style={{ color: 'var(--quiet)' }}>
        Browse
      </p>
      {STORE_TYPE_CONFIG.map(({ slug, label, Icon }) => {
        const pressed = active === slug
        return (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            title={label}
            className="shop-browse-btn"
            onClick={() => choose(slug)}
          >
            <span className={pressed ? 'shop-circle is-on' : 'shop-circle'}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className={expanded ? undefined : 'shop-rail-label'}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
