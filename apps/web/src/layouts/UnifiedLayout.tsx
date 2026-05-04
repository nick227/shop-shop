/**
 * Unified Layout exports — wraps existing named layouts for consistent imports.
 */
import React from 'react'
import AppLayoutDefault from './App.layout'
import { AuthLayout as AuthLayoutDefault } from './Auth.layout'

export const AppLayout = AppLayoutDefault
export const AuthLayout = AuthLayoutDefault

// MarketingLayout reuses AppLayout with no top-navigation chrome
export const MarketingLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="marketing-layout">{children}</div>
)

export default AppLayout
