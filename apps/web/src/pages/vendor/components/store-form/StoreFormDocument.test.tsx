import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData } from '@shared/lib/utils/form-utilities'
import { StoreFormDocument } from './StoreFormDocument'

vi.mock('./storePhotoApi', () => ({
  listStorePhotos: vi.fn().mockResolvedValue([]),
  uploadStorePhoto: vi.fn(),
  deleteStorePhoto: vi.fn(),
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
    expect(screen.queryByRole('tab', { name: 'Summary' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Store', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Store' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Photos' })).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByText('Public page')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Disabled' })).toBeChecked()
    expect(screen.queryByRole('heading', { name: 'Public URL' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Enabled' }))
    expect(screen.getByRole('radio', { name: 'Enabled' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Street *')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Store name' })).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Add photo')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Photos' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Street *')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Location' }))
    expect(screen.getByRole('heading', { name: 'Location' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Address' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hours' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Store' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Street *')).toBeInTheDocument()
    expect(screen.queryByLabelText('Add photo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Orders' }))
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Enabled' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delivery fee ($)')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Delivery'))
    expect(screen.getByLabelText('Delivery fee ($)')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Contact' }))
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Links' })).toBeInTheDocument()
    expect(screen.getByLabelText('Company')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Add a link' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Add photo')).not.toBeInTheDocument()
  })

  it('shows the public store link once the store exists', () => {
    const formData = { ...createInitialStoreFormData(), name: 'Northside Bakery' }
    render(
      <StoreFormDocument
        isEdit
        storeId="store-1"
        formData={formData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        pendingFiles={[]}
        onPendingFiles={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Public URL' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /\/kitchen\/northside-bakery-store-1/ })).toBeInTheDocument()
  })
})
