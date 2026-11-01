import { useState } from 'react'
import { useMatches } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import { AccountMenu } from './AccountMenu'
import { OrderAlertsDialog } from './OrderAlertsDialog'

function usePageTitle(): string {
  const matches = useMatches()
  const match = [...matches].reverse().find((m) => (m.handle as { title?: string } | undefined)?.title)
  return (match?.handle as { title?: string } | undefined)?.title ?? ''
}

export function VendorTopBar() {
  const { selectedStore } = useVendorActiveStore()
  const title = usePageTitle()
  const [alertsOpen, setAlertsOpen] = useState(false)

  return (
    <>
      <p className="min-w-0 flex-1 truncate text-base font-semibold lg:invisible">{title}</p>
      {selectedStore ? (
        <a
          href={getStoreRoute({ id: selectedStore.id, name: selectedStore.name })}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted sm:inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </a>
      ) : null}
      <AccountMenu onOpenOrderAlerts={() => setAlertsOpen(true)} />
      <OrderAlertsDialog open={alertsOpen} onOpenChange={setAlertsOpen} />
    </>
  )
}
