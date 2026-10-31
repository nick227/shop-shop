import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { SearchInput } from '@shared/ui/primitives'
import { useCartStore } from '@stores/cartStore'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { DrawerNav } from './ShopNav'

function cartCount(raw: unknown): number {
  try {
    const items = typeof raw === 'string' ? JSON.parse(raw) as unknown : raw
    if (!Array.isArray(items)) return 0
    return items.reduce<number>((sum, item) => sum + ((item as { quantity?: number }).quantity ?? 0), 0)
  } catch {
    return 0
  }
}

export function ShoppingChrome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { location: place } = useUrlLocation()
  const cart = useCartStore((state) => state.cart)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const count = cartCount(cart?.items)
  const placeLabel = place?.zip
    ? `${place.zip}${place.city ? ` ${place.city}` : ''}`
    : 'Set ZIP'

  const submitSearch = () => {
    const next = new URLSearchParams(location.search)
    const trimmed = query.trim()
    if (trimmed) next.set('q', trimmed)
    else next.delete('q')
    next.delete('browse')
    navigate({ pathname: '/search', search: next.toString() })
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2" style={{ background: 'color-mix(in srgb, var(--air) 92%, transparent)' }}>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        {place?.zip ? (
          <Link
            to="/river"
            className="shop-mono max-w-24 truncate text-xs lg:hidden"
          >
            {place.zip}
          </Link>
        ) : (
          <Link to="/river" className="shop-display text-lg font-bold lg:hidden">S</Link>
        )}
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            submitSearch()
          }}
        >
          <SearchInput
            aria-label="Search products, stores, or a type"
            placeholder="Search products, stores, or a type"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <Link
          to={{ pathname: '/river', search: location.pathname === '/river' ? location.search : undefined }}
          className="shop-mono hidden min-h-11 items-center px-2 text-xs sm:inline-flex"
          style={{ color: 'var(--quiet)' }}
        >
          {placeLabel}
        </Link>
        <Link to="/cart" className="relative inline-flex h-11 w-11 items-center justify-center" aria-label="Cart">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 ? (
            <span
              className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
              style={{ background: 'var(--citrus)', color: 'white' }}
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </Link>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[min(86vw,20rem)] flex-col px-4 py-5"
            style={{ background: 'var(--air)' }}
          >
            <button
              type="button"
              className="mb-2 inline-flex h-11 w-11 items-center justify-center"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <DrawerNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
