/**
 * CustomerAddressesPage - Manage saved addresses;
 */

import { Button } from '@shared/ui/primitives'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { MapPin, Plus } from 'lucide-react'

export default function CustomerAddressesPage() {
  return (
    <PageContainer className="max-w-4xl">
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
    </PageContainer>
  )
}
