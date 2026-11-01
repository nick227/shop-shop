import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs } from '@shared/ui/primitives'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'

type MenuTab = 'items' | 'bundles'

/** Items and Bundles are two views of one menu; each tab has its own URL so links keep working. */
export function MenuTabs({ storeId }: { readonly storeId: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tab: MenuTab = pathname.startsWith(vendorPaths.bundles(storeId)) ? 'bundles' : 'items'

  return (
    <Tabs
      label="Menu sections"
      items={[
        { id: 'items', label: 'Items' },
        { id: 'bundles', label: 'Bundles' },
      ]}
      value={tab}
      onChange={(next) => navigate(next === 'bundles' ? vendorPaths.bundles(storeId) : vendorPaths.menu(storeId))}
    />
  )
}
