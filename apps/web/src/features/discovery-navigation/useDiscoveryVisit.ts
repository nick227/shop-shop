import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { readVisit, saveVisit } from './context'

/** Restore once content has grown enough; stop if the shopper starts scrolling. */
export function useDiscoveryVisit(selected?: string) {
  const location = useLocation()
  const url = location.pathname + location.search + location.hash
  const current = useRef(selected)
  current.current = selected
  // Detach before the destination changes document height and emits a clamped scroll.
  useLayoutEffect(() => {
    const saved = readVisit(url)
    let restoring = Boolean(saved && saved.y > 0)
    let focusPending = Boolean(saved?.href)
    const restore = () => {
      if (focusPending) {
        const link = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-discovery-destination]'))
          .find((entry) => entry.dataset.discoveryDestination === saved?.href)
        if (link) { link.focus({ preventScroll: true }); focusPending = false }
      }
      if (!restoring || !saved) return
      window.scrollTo(0, saved.y)
      if (document.documentElement.scrollHeight - window.innerHeight >= saved.y) restoring = false
    }
    const stop = () => { restoring = false; focusPending = false }
    const remember = () => {
      if (!restoring) saveVisit(url, { y: window.scrollY, selected: current.current })
    }
    const observer = new ResizeObserver(restore)
    observer.observe(document.body)
    const frame = requestAnimationFrame(restore)
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', stop)
    window.addEventListener('scroll', remember, { passive: true })
    window.addEventListener('pagehide', remember)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', stop)
      window.removeEventListener('scroll', remember)
      window.removeEventListener('pagehide', remember)
    }
  }, [url])
  useEffect(() => {
    const saved = readVisit(url)
    saveVisit(url, { y: saved?.y ?? window.scrollY, selected })
  }, [url, selected])
}
