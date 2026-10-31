import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData } from '@shared/lib/utils/form-utilities'
import { StoreFormDocument } from './StoreFormDocument'

vi.mock('@shared/ui/media', () => ({
  EnhancedMediaGalleryManager: () => <div>Photo gallery</div>,
}))

vi.mock('@features/auth/components/StoreHoursEditor', () => ({
  StoreHoursEditor: () => <div>Hours</div>,
}))

function Harness() {
  const [formData, setFormData] = useState<StoreFormData>({
    ...createInitialStoreFormData(),
    deliveryEnabled: false,
    pickupEnabled: false,
  })

  return (
    <StoreFormDocument
      isEdit={false}
      formData={formData}
      onChange={(field, value) => setFormData((current) => ({ ...current, [field]: value }))}
      onSubmit={vi.fn()}
      isSubmitting={false}
      pendingFiles={[]}
      onPendingFiles={vi.fn()}
    />
  )
}

describe('StoreFormDocument', () => {
  it('shows the store fields without progress chrome, and keeps contact closed', async () => {
    const user = userEvent.setup()

    render(<Harness />)

    expect(screen.getByLabelText('Store name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Street *')).toBeInTheDocument()
    expect(screen.getByLabelText('City *')).toBeInTheDocument()
    expect(screen.getByLabelText('ZIP *')).toBeInTheDocument()
    expect(screen.getByText('Add a name and address to save.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.queryByText('Setup Progress')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Company')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delivery fee ($)')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Delivery'))
    expect(screen.getByLabelText('Delivery fee ($)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Contact', expanded: false }))
    expect(screen.getByLabelText('Company')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Add a link' })).toBeInTheDocument()
  })
})
