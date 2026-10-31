/**
 * Vendor store directory. The working store drives Menu, Orders, and Team.
 */
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth/hooks/useAuth'
import { Button, Spinner } from '@shared/ui/primitives'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { ArrowLeft } from 'lucide-react'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { useVendorStores } from '@shared/hooks/hooks/vendor'
import { StoreDirectory } from './components/StoreDirectory'

const PAGE_DESCRIPTION =
  'Choose the store you are working in. Menu, orders, and team follow it. Card payments and deletion stay with that store.'

function DirectoryShell({ children }: { readonly children: ReactNode }) {
  return (
    <PageShell nested className="bg-background" containerClassName="max-w-3xl" contentClassName="py-6 md:py-6">
      {children}
    </PageShell>
  )
}

export default function VendorDashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { selectedStoreId, setSelectedStoreId } = useVendorActiveStore()
  const { data: stores = [], isLoading, error } = useVendorStores()

  if (isLoading) {
    return (
      <DirectoryShell>
        <div className="flex min-h-[320px] flex-col items-center justify-center">
          <Spinner size="large" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your stores</p>
        </div>
      </DirectoryShell>
    )
  }

  if (error) {
    return (
      <DirectoryShell>
        <h1 className="text-2xl font-bold tracking-tight">My Stores</h1>
        <p className="mt-2 text-sm text-destructive">Stores could not be loaded. Refresh and try again.</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </DirectoryShell>
    )
  }

  if (stores.length === 0) {
    return (
      <DirectoryShell>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">My Stores</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Add a store to publish a menu and take orders.
        </p>
        <Button className="mt-6" onClick={() => navigate('/vendor/store/new')}>
          Create Store
        </Button>
      </DirectoryShell>
    )
  }

  return (
    <DirectoryShell>
      <PageHeader
        title="My Stores"
        description={PAGE_DESCRIPTION}
        backButton={
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate('/')}
            className="-ml-2 text-muted-foreground hover:bg-transparent"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Home
          </Button>
        }
        actions={
          <>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
            <Button variant="primary" onClick={() => navigate('/vendor/store/new')}>
              Create Store
            </Button>
          </>
        }
      />

      <StoreDirectory
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelect={setSelectedStoreId}
        onOpenMenu={(storeId) => navigate(`/vendor/stores/${storeId}/items`)}
        onEdit={(storeId) => navigate(`/vendor/stores/${storeId}/edit`)}
      />
    </DirectoryShell>
  )
}
