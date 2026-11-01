import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { cn } from '@shared/lib/cn'
import { placeTarget } from './placeMemory'

export function BrowseNav({ expanded }: { readonly expanded: boolean }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const onHome = pathname === '/' || pathname === '/river'
  const active = onHome ? (params.get('browse') ?? '') : undefined

  const choose = (slug: string) => {
    const next = new URLSearchParams(onHome ? params : placeTarget('/river', params.toString()).search)
    if (slug) next.set('browse', slug)
    else next.delete('browse')
    navigate({ pathname: '/river', search: next.toString() })
  }

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
            className={cn(
              'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium',
              pressed ? 'bg-[var(--leaf)] text-white' : 'hover:bg-[var(--field)]',
            )}
            onClick={() => choose(slug)}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span className={expanded ? undefined : 'shop-rail-label'}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
