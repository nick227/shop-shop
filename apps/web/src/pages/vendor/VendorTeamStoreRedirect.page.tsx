import { Navigate, useParams } from 'react-router-dom'

/** Legacy `/vendor/stores/:storeId/team` → `/vendor/team?storeId=` */
export default function VendorTeamStoreRedirectPage() {
  const { storeId } = useParams()
  if (!storeId) return <Navigate to="/vendor/team" replace />
  return <Navigate to={`/vendor/team?storeId=${encodeURIComponent(storeId)}`} replace />
}
