/**
 * Layout - Root layout with persistent elements;
 */
import { Outlet } from 'react-router-dom'
import { CartWidget } from '../features/cart/components/CartWidget'
import { Header } from '../components/header/Header'
import { HeaderAddressExtrasProvider } from '../components/header/HeaderAddressExtrasContext'

export function Layout() {
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

