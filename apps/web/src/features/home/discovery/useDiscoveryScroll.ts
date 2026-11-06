import { useLayoutEffect, useRef } from 'react'

/** A new place starts at the header. Category, search, and map keep the current scroll. */
export function useDiscoveryScroll(placeKey: string) {
  const previous = useRef(placeKey)
  useLayoutEffect(() => {
    if (previous.current === placeKey) return
    previous.current = placeKey
    window.scrollTo(0, 0)
  }, [placeKey])
}
