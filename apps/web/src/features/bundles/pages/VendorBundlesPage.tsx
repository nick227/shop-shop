/**
 * Vendor Bundles Page
 * Main page for bundle management in vendor control panel
 */
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@layouts/PageHeader'
import { BundleList } from '../components/BundleList'
import { BundleFormModal } from '../components/BundleFormModal'
import type { Bundle } from '../../../api/types'

export function VendorBundlesPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)

  if (!storeId) {
    return (
      <div className="vendor-bundles-page vendor-bundles-page--error">
        <div className="vendor-bundles-page__error">
          <h2>Store Not Found</h2>
          <p>Please select a valid store to manage bundles.</p>
        </div>
      </div>
    )
  }

  const handleCreateBundle = () => {
    setEditingBundle(null)
    setIsCreateModalOpen(true)
  }

  const handleEditBundle = (bundle: Bundle) => {
    setEditingBundle(bundle)
    setIsCreateModalOpen(true)
  }

  const handleDeleteBundle = (bundle: Bundle) => {
    // Bundle deletion is handled in BundleList component
    console.log('Bundle deleted:', bundle.name)
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingBundle(null)
  }

  return (
    <div className="vendor-bundles-page">
      <PageHeader
        title="Bundle Management"
        subtitle="Create and manage product bundles for your store"
        breadcrumbs={[
          { label: 'Dashboard', href: '/vendor' },
          { label: 'Store Management', href: `/vendor/stores/${storeId}` },
          { label: 'Bundles' }
        ]}
      />

      <div className="vendor-bundles-page__content">
        <BundleList
          storeId={storeId}
          onEditBundle={handleEditBundle}
          onDeleteBundle={handleDeleteBundle}
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
    </div>
  )
}

// Vendor Bundles Page Styles
export const vendorBundlesPageStyles = `
.vendor-bundles-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
}

.vendor-bundles-page__content {
  flex: 1;
}

.vendor-bundles-page--error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.vendor-bundles-page__error {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vendor-bundles-page__error h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.vendor-bundles-page__error p {
  margin: 0;
  color: var(--text-secondary);
}
`
