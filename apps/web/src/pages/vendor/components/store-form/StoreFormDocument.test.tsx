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
  it('keeps the store name above the tabs and shows one section at a time', async () => {
    const user = userEvent.setup()

    render(<Harness />)

    expect(screen.getByRole('textbox', { name: 'Store name' })).toBeInTheDocument()
    expect(screen.queryByText('New store')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Summary', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Address needed')).toBeInTheDocument()
    expect(screen.queryByLabelText('Street *')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Description')).not.toBeInTheDocument()
    expect(screen.getByText('Add a name and address to save.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Store' }))
    expect(screen.getByRole('textbox', { name: 'Store name' })).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.queryByLabelText('Street *')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Location' }))
    expect(screen.getByLabelText('Street *')).toBeInTheDocument()
    expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Orders' }))
    expect(screen.queryByLabelText('Delivery fee ($)')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Delivery'))
    expect(screen.getByLabelText('Delivery fee ($)')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Contact' }))
    expect(screen.getByLabelText('Company')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Add a link' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Summary' }))
    await user.click(screen.getByRole('button', { name: /Photos/ }))
    expect(screen.getByText('Photo gallery')).toBeInTheDocument()
  })
})
