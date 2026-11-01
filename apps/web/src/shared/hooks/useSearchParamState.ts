import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * One string value kept in the URL query, so tabs and filters survive reloads and links.
 * Values outside `allowed` read as `fallback`; the fallback is left out of the URL.
 */
export function useSearchParamState<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(key)
  const value = raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback

  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === fallback) params.delete(key)
          else params.set(key, next)
          return params
        },
        { replace: true },
      )
    },
    [key, fallback, setSearchParams],
  )

  return [value, setValue]
}
