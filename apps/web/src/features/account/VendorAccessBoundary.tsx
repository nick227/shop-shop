import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAccountCapabilities } from './useAccountCapabilities'

export function VendorAccessBoundary({ children, createStore = false }: {
  readonly children: ReactNode
  readonly createStore?: boolean
}) {
  const { capabilities, isPending, isError, refetch } = useAccountCapabilities()
  if (isPending) return <p className="p-8" role="status">Checking account access…</p>
  if (isError) return <div className="p-8"><p>Account access could not be checked.</p><button onClick={() => void refetch()}>Try again</button></div>
  if (!capabilities?.canAccessVendorPortal) return <Navigate to="/" replace />
  if (createStore && !capabilities.canCreateStore) return <Navigate to="/vendor" replace />
  return <>{children}</>
}
