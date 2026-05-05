import { useEffect, useState } from 'react'

/**
 * After `active` becomes true, waits `delayMs` before returning true.
 * Used to avoid a flash of empty state on fast API responses.
 */
export function useDelayedEmptyReveal(active: boolean, delayMs: number): boolean {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!active) {
      setRevealed(false)
      return
    }
    const id = window.setTimeout(() => setRevealed(true), delayMs)
    return () => window.clearTimeout(id)
  }, [active, delayMs])

  return revealed
}
