import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@shared/ui/primitives'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { locationValidator } from '@shared/lib/utils/validation/unified'

const RADII = [5, 15, 25] as const

export function PlaceField({ tone }: { readonly tone: 'hero' | 'bar' }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { location, urlLocationNotice } = useUrlLocation()
  const [zip, setZip] = useState(location?.zip ?? '')
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (location?.zip) setZip(location.zip)
  }, [location?.zip])

  const commit = (next: URLSearchParams) => {
    navigate({ search: next.toString() }, { replace: true })
  }

  const submitZip = () => {
    const trimmed = zip.trim()
    const check = locationValidator.validateZipCode(trimmed)
    if (!check.valid) {
      setError(check.error ?? 'Enter a 5-digit ZIP.')
      return
    }
    setError(undefined)
    const next = new URLSearchParams(params)
    next.set('zip', trimmed)
    next.delete('lat')
    next.delete('lng')
    next.delete('city')
    next.delete('state')
    if (!next.get('radius')) next.set('radius', '5')
    commit(next)
  }

  const setRadius = (miles: number) => {
    const next = new URLSearchParams(params)
    next.set('radius', String(miles))
    commit(next)
  }

  const compact = tone === 'bar'

  return (
    <form
      className={compact ? 'min-w-0' : 'max-w-sm space-y-3'}
      onSubmit={(event) => {
        event.preventDefault()
        submitZip()
      }}
    >
      <Input
        inputMode="numeric"
        autoComplete="postal-code"
        aria-label="Delivery ZIP"
        placeholder="ZIP"
        value={zip}
        size={compact ? 'sm' : 'lg'}
        className="!h-12 !border-[var(--line)] !bg-[var(--paper)]"
        variant="filled"
        onChange={(event) => setZip(event.target.value)}
        error={error}
      />
      {!compact ? (
        <button
          type="submit"
          className="min-h-11 rounded-xl border px-4 text-sm font-medium"
          style={{ borderColor: 'var(--line)', background: 'var(--paper)', color: 'var(--ink)' }}
        >
          Use this ZIP
        </button>
      ) : null}
      {!compact && location ? (
        <div className="flex gap-2" role="group" aria-label="Search radius">
          {RADII.map((miles) => {
            const active = Math.round(location.radiusMiles) === miles
            return (
              <button
                key={miles}
                type="button"
                aria-pressed={active}
                onClick={() => setRadius(miles)}
                className="shop-mono min-h-11 rounded-xl border px-4 text-xs"
                style={{
                  borderColor: active ? 'var(--ink)' : 'var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              >
                {miles} mi
              </button>
            )
          })}
        </div>
      ) : null}
      {urlLocationNotice && !compact ? (
        <p className="text-sm" style={{ color: 'var(--citrus)' }}>{urlLocationNotice.message}</p>
      ) : null}
    </form>
  )
}
