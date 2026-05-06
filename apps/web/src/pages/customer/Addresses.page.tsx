/**
 * CustomerAddressesPage - Manage saved addresses;
 */

import { Button } from '@shared/ui/primitives'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { MapPin, Plus } from 'lucide-react'

export default function CustomerAddressesPage() {
  return (
    <PageShell nested className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader
        title="My Addresses"
        description="Manage your saved delivery addresses"
        actions={
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        }
      />

      <EmptyState
        icon={MapPin}
        title="No saved addresses"
        description="Add delivery addresses for faster checkout"
        action={
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Address
          </Button>
        }
      />
    </PageShell>
  )
}
