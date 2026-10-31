import { Outlet } from 'react-router-dom'
import { RailNav } from './ShopNav'
import { ShoppingChrome } from './ShoppingChrome'
import './shop-shell.css'

export function ShoppingShell() {
  return (
    <div className="shop-shell">
      <RailNav />
      <div className="shop-main">
        <ShoppingChrome />
        <Outlet />
      </div>
    </div>
  )
}
