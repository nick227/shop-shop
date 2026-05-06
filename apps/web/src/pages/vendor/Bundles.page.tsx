/**
 * Vendor Bundles Page
 * Main page for bundle management in vendor control panel
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Button } from '@shared/ui/primitives'
import { BundleList } from '@features/bundles/components/BundleList'
import { BundleFormModal } from '@features/bundles/components/BundleFormModal'
import { ArrowLeft, Plus } from 'lucide-react'
import type { Bundle } from '@api/types'
import { useHaptics } from '@shared/hooks/useHaptics'

export default function VendorBundlesPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const haptics = useHaptics()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | undefined>()

  if (!storeId) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center">
          <h2 className="mb-2 text-xl font-bold text-destructive">Store Not Found</h2>
          <p className="mb-4 text-muted-foreground">Please select a valid store to manage bundles.</p>
          <Button onClick={() => navigate('/vendor/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </PageShell>
    )
  }

  const handleCreateBundle = () => {
    haptics.light()
    setEditingBundle(undefined)
    setIsCreateModalOpen(true)
  }

  const handleEditBundle = (bundle: Bundle) => {
    haptics.light()
    setEditingBundle(bundle)
    setIsCreateModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingBundle(undefined)
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader
        title="Bundle Management"
        description="Create and manage product bundles for your store"
        backButton={
          <Button 
            variant="ghost" 
            size="small" 
            onClick={() => navigate(`/vendor/dashboard`)} 
            className="-ml-2 mb-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/vendor' },
          { label: 'Bundles' }
        ]}
        actions={
          <Button 
            variant="primary" 
            onClick={handleCreateBundle}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        }
      />

      <div className="mt-4">
        <BundleList
          storeId={storeId}
          onEditBundle={handleEditBundle}
          onCreateBundle={handleCreateBundle}
        />
      </div>

      {isCreateModalOpen && (
        <BundleFormModal
          storeId={storeId}
          bundle={editingBundle}
          onClose={handleCloseModal}
        />
      )}
    </PageShell>
  )
}

