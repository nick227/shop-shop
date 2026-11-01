import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData } from '@shared/lib/utils/form-utilities'
import { StoreSettings } from './StoreSettings'

vi.mock('./storePhotoApi', () => ({
  listStorePhotos: vi.fn().mockResolvedValue([]),
  uploadStorePhoto: vi.fn(),
  deleteStorePhoto: vi.fn(),
}))
vi.mock('@features/auth/components/StoreHoursEditor', () => ({ StoreHoursEditor: () => <div>Hours</div> }))
vi.mock('../VendorStripeConnectSection', () => ({ VendorStripeConnectSection: () => <div>Stripe payouts</div> }))
vi.mock('../DeleteStoreSection', () => ({ DeleteStoreSection: () => <div>Delete store</div> }))

const saved: StoreFormData = { ...createInitialStoreFormData(), name: 'Northside Bakery' }

function Where() {
  const location = useLocation()
  return <output aria-label="location">{location.search}</output>
}

function Harness() {
  const [formData, setFormData] = useState<StoreFormData>(saved)
  return (
    <>
      <StoreSettings
        storeId="store-1"
        storeName="Northside Bakery"
        loading={false}
        formData={formData}
        onChange={(field, value) => setFormData((current) => ({ ...current, [field]: value }))}
        isSubmitting={false}
        isDirty={JSON.stringify(formData) !== JSON.stringify(saved)}
        onSubmit={vi.fn()}
        onDiscard={() => setFormData(saved)}
        pendingFiles={[]}
        onPendingFiles={vi.fn()}
        onDeleted={vi.fn()}
      />
      <Where />
    </>
  )
}

function renderSettings(path = '/vendor/stores/store-1/edit') {
  const router = createMemoryRouter([{ path: '*', element: <Harness /> }], { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('StoreSettings', () => {
  it('heads the section Store settings and keeps the store name as a field', () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 2, name: 'Store settings' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Store name/)).toHaveValue('Northside Bakery')
    expect(screen.getByText('Delete store')).toBeInTheDocument()
  })

  it('shows the save bar only after a change, and discards back to saved', async () => {
    const user = userEvent.setup()
    renderSettings()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Store name/), ' & Co')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByLabelText(/Store name/)).toHaveValue('Northside Bakery')
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })

  it('keeps the tab in the URL and puts payouts under Payments', async () => {
    const user = userEvent.setup()
    renderSettings('/vendor/stores/store-1/edit?tab=location')
    expect(screen.getByRole('tab', { name: 'Location', selected: true })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Payments' }))
    expect(screen.getByLabelText('location')).toHaveTextContent('?tab=payments')
    expect(screen.getByText('Stripe payouts')).toBeInTheDocument()
    expect(screen.queryByText('Delete store')).not.toBeInTheDocument()
  })
})
