/**
 * Layout - Root layout with persistent elements and dynamic page titles;
 */
import { Outlet, useMatches, useLocation } from 'react-router-dom'
import { CartWidget } from '../features/cart/components/CartWidget'
import { Header } from '../components/header/Header'
import { HeaderAddressExtrasProvider } from '../components/header/HeaderAddressExtrasContext'
import { setPageTitle, BRAND_NAME } from '../hooks/usePageTitle'
import { useEffect } from 'react'

export function Layout() {
  const matches = useMatches()
  const location = useLocation()

  useEffect(() => {
    // Find the deepest route with a handle.title
    const routeWithTitle = [...matches]
      .reverse()
      .find((m) => (m.handle as { title?: string })?.title)

    const staticTitle = (routeWithTitle?.handle as { title?: string })?.title

    if (staticTitle) {
      setPageTitle(staticTitle, BRAND_NAME)
    } else {
      // Fallback for routes without static titles (dynamic pages set their own)
      setPageTitle(BRAND_NAME)
    }
  }, [location.pathname])

  return (
    <HeaderAddressExtrasProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <CartWidget />
    </HeaderAddressExtrasProvider>
  )
}

export default Layout
