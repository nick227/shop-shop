/**
 * Vendor Bundles Page
 * Main page for bundle management in vendor control panel
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
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
      <PageContainer className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Store Not Found</h2>
          <p className="text-muted-foreground mb-4">Please select a valid store to manage bundles.</p>
          <Button onClick={() => navigate('/vendor/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </PageContainer>
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
    <PageContainer>
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
    </PageContainer>
  )
}

