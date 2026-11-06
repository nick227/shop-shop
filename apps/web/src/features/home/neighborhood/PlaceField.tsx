import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@shared/ui/primitives'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { locationValidator } from '@shared/lib/utils/validation/unified'
import { applyDiscoveryPatch } from '../discovery/discoveryContext'
import { placeZip, rememberPlace } from '../shell/placeMemory'

export function PlaceField({ tone }: { readonly tone: 'hero' | 'bar' }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const { location } = useUrlLocation()
  const sharedZip = location?.zip || placeZip(params.toString())
  const [zip, setZip] = useState(sharedZip)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (sharedZip) setZip(sharedZip)
  }, [sharedZip])

  const submitZip = () => {
    const trimmed = zip.trim()
    const check = locationValidator.validateZipCode(trimmed)
    if (!check.valid) {
      setError(check.error ?? 'Enter a 5-digit ZIP.')
      return
    }
    setError(undefined)
    const destination = applyDiscoveryPatch(pathname, params.toString(), { zip: trimmed, neighborhood: null, city: null })
    rememberPlace(destination.search)
    navigate(destination, { replace: true })
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
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
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
        </div>
        {!compact ? (
          <button
            type="submit"
            className="h-12 shrink-0 rounded-xl border px-4 text-sm font-medium"
            style={{ borderColor: 'var(--line)', background: 'var(--paper)', color: 'var(--ink)' }}
          >
            Go
          </button>
        ) : null}
      </div>
    </form>
  )
}
