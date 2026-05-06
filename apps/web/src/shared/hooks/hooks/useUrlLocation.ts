/**
 * useUrlLocation — URL parameter parsing, validation, and ZIP deep-links via geocoding API.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocationParams } from './useLocationParams'
import {
  isSameLocation,
  processUrlParams,
  detectUrlParamType,
  type LocationData,
} from './utils/urlLocationUtils'
import { locationValidator } from '@shared/lib/utils/validation/unified'
import { geocodeZip } from '../../../services/geocoding'
import type { UrlLocationNoticePayload } from '@features/home/components'

interface UseUrlLocationResult {
  readonly location: LocationData | undefined
  readonly urlLocationNotice: UrlLocationNoticePayload | undefined
  readonly setLocation: (location: LocationData | undefined) => void
  readonly setUrlLocationNotice: (notice: UrlLocationNoticePayload | undefined) => void
  readonly clearLocation: () => void
}

function classifySyncMessage(message: string): UrlLocationNoticePayload['variant'] {
  if (/coordinates required|city and state required/i.test(message)) return 'warning'
  if (/invalid/i.test(message)) return 'warning'
  return 'error'
}

export function useUrlLocation(): UseUrlLocationResult {
  const { params: urlParams, clearParams } = useLocationParams()
  const [location, setLocation] = useState<LocationData | undefined>()
  const [urlLocationNotice, setUrlLocationNotice] = useState<UrlLocationNoticePayload | undefined>()

  const memoizedUrlParams = useMemo(() => urlParams, [
    urlParams.latitude,
    urlParams.longitude,
    urlParams.radiusMiles,
    urlParams.city,
    urlParams.state,
    urlParams.zip,
  ])

  const zipKey = `${memoizedUrlParams.zip ?? ''}|${memoizedUrlParams.radiusMiles ?? ''}`

  // ZIP query params → coordinates via server geocoding
  useEffect(() => {
    const paramType = detectUrlParamType(memoizedUrlParams)
    if (paramType !== 'zip' || !memoizedUrlParams.zip) return

    const zipCheck = locationValidator.validateZipCode(memoizedUrlParams.zip)
    if (!zipCheck.valid) {
      setUrlLocationNotice({
        message: 'That ZIP doesn’t look valid. Pick a city below or adjust the link.',
        variant: 'warning',
      })
      setLocation(undefined)
      return
    }

    let cancelled = false
    setUrlLocationNotice(undefined)

    void (async () => {
      const geo = await geocodeZip(memoizedUrlParams.zip!)
      if (cancelled) return
      if (geo) {
        const radiusRaw = memoizedUrlParams.radiusMiles
          ? Number.parseFloat(memoizedUrlParams.radiusMiles)
          : 25
        const radiusMiles = Number.isFinite(radiusRaw) ? radiusRaw : 25
        const next: LocationData = {
          latitude: geo.latitude,
          longitude: geo.longitude,
          radiusMiles,
          displayName: geo.displayName,
          source: 'search',
          city: geo.city,
          state: geo.state,
          zip: geo.zip ?? memoizedUrlParams.zip,
        }
        setLocation((prev) => (isSameLocation(prev, next) ? prev : next))
        setUrlLocationNotice(undefined)
      } else {
        setUrlLocationNotice({
          message:
            'We couldn’t look up that ZIP. Choose a city below or try another area.',
          variant: 'warning',
        })
        setLocation(undefined)
      }
    })()

    return () => {
      cancelled = true
    }
  // zipKey bundles zip + radius; effect body reads latest memoizedUrlParams when zipKey changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- zipKey is the intentional dependency surface
  }, [zipKey])

  // Coordinates and city/state deep-links (sync)
  useEffect(() => {
    const paramType = detectUrlParamType(memoizedUrlParams)
    if (paramType === 'zip' && memoizedUrlParams.zip) {
      return
    }

    if (paramType === 'none') {
      setLocation(undefined)
      setUrlLocationNotice(undefined)
      return
    }

    const result = processUrlParams(memoizedUrlParams)

    if (result.valid && result.location) {
      setLocation((prev) => {
        if (isSameLocation(prev, result.location)) return prev
        return result.location!
      })
      setUrlLocationNotice(undefined)
      return
    }

    if (result.error) {
      setUrlLocationNotice({
        message: result.error,
        variant: classifySyncMessage(result.error),
      })
      setLocation(undefined)
      return
    }

    setUrlLocationNotice(undefined)
  }, [memoizedUrlParams])

  const setLocationWithEquality = useCallback(
    (newLocation: LocationData | undefined) => {
      setLocation((prev) => {
        if (isSameLocation(prev, newLocation)) return prev
        return newLocation
      })
      if (newLocation === undefined) {
        clearParams()
      }
    },
    [clearParams],
  )

  const clearLocation = useCallback(() => {
    setLocation(undefined)
    clearParams()
    setUrlLocationNotice(undefined)
  }, [clearParams])

  return {
    location,
    urlLocationNotice,
    setLocation: setLocationWithEquality,
    setUrlLocationNotice,
    clearLocation,
  }
}
