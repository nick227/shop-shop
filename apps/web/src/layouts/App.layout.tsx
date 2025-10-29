/**
 * Layout - Root layout with persistent elements;
 */
import { Outlet } from 'react-router-dom'
import { CartWidget } from '../features/cart/components/CartWidget'

export function Layout() {
  console.log('📐 Layout rendering')
  return (
    <>
      <Outlet />
      <CartWidget />
    </>
  )
}

