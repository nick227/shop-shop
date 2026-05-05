/**
 * Unified Layout exports — wraps existing named layouts for consistent imports.
 */
import React from 'react'
import AppLayoutDefault from './App.layout'


export const AppLayout = AppLayoutDefault


// MarketingLayout reuses AppLayout with no top-navigation chrome
export const MarketingLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="marketing-layout">{children}</div>
)

export default AppLayout

export {AuthLayout} from './Auth.layout'