import { forwardRef } from 'react'
import { Link, useLocation, type LinkProps } from 'react-router-dom'
import { isDiscoveryPath } from '@features/home/discovery/discoveryContext'
import { saveVisit, withDiscoveryOrigin } from './context'

/** Keep a real href so modifier clicks, copying links and new tabs retain context. */
export const DiscoveryLink = forwardRef<HTMLAnchorElement, LinkProps>(function DiscoveryLink({ to, onClick, onAuxClick, ...props }, ref) {
  const location = useLocation()
  const destination = typeof to === 'string' ? to : `${to.pathname ?? location.pathname}${to.search ? (to.search.startsWith('?') ? to.search : `?${to.search}`) : ''}${to.hash ?? ''}`
  const contextual = withDiscoveryOrigin(destination, location.pathname, location.search, location.hash)
  const remember = () => {
    if (contextual !== destination && isDiscoveryPath(location.pathname)) {
      saveVisit(location.pathname + location.search + location.hash, { y: window.scrollY, href: destination })
    }
  }
  return <Link {...props} ref={ref} data-discovery-destination={contextual !== destination ? destination : undefined}
    onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) remember() }}
    onAuxClick={(event) => { onAuxClick?.(event); if (!event.defaultPrevented) remember() }}
    to={contextual === destination ? to : contextual} />
})
