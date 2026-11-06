import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData, storePayloadFromFormData, transformStoreToFormData } from '@shared/lib/utils/form-utilities'
import { StoreContactSection } from './StoreContactSection'

let latest: StoreFormData
function Harness({ initial }: { readonly initial: StoreFormData }) {
  const [formData, setFormData] = useState(initial)
  latest = formData
  return <StoreContactSection formData={formData} onChange={(key, value) => setFormData((prev) => ({ ...prev, [key]: value }))} />
}

const savedStore = (email: string | null, confirmedAt: string | null) =>
  transformStoreToFormData({ name: 'Shop', slug: 'shop', phone: '', email, website: '', publicEmailConfirmedAt: confirmedAt } as never)

describe('public business email field', () => {
  it('starts blank for a new store, says it is public, and sends nothing when left blank', () => {
    render(<Harness initial={createInitialStoreFormData()} />)
    const field = screen.getByLabelText('Public business email')
    expect(field).toHaveValue('')
    expect(screen.getByText('Displayed to shoppers on your storefront.')).toBeInTheDocument()
    const payload = storePayloadFromFormData(latest) as Record<string, unknown>
    expect(payload.email).toBe('')
    expect(payload).not.toHaveProperty('publicEmailConfirmed')
    expect(payload).not.toHaveProperty('publicEmailSaved')
  })

  it('marks a typed address as going public on save', async () => {
    render(<Harness initial={createInitialStoreFormData()} />)
    await userEvent.type(screen.getByLabelText('Public business email'), 'hi@shop.test')
    expect(screen.getByText('Will show on your storefront when you save.')).toBeInTheDocument()
  })

  it('holds a legacy, unconfirmed address back until the vendor confirms it', async () => {
    render(<Harness initial={savedStore('owner@account.test', null)} />)
    expect(screen.getByRole('status')).toHaveTextContent('saved but not shown to shoppers')
    // Re-saving untouched carries no consent.
    expect(storePayloadFromFormData(latest)).not.toHaveProperty('publicEmailConfirmed')

    await userEvent.click(screen.getByRole('button', { name: 'Show on storefront' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Shown on your storefront.')).toBeInTheDocument()
    expect(storePayloadFromFormData(latest)).toMatchObject({ email: 'owner@account.test', publicEmailConfirmed: true })
  })

  it('lets the vendor remove a legacy address', async () => {
    render(<Harness initial={savedStore('owner@account.test', null)} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove email' }))
    expect(screen.getByLabelText('Public business email')).toHaveValue('')
    expect(storePayloadFromFormData(latest)).toMatchObject({ email: '' })
  })

  it('treats a replaced legacy address as newly typed', async () => {
    render(<Harness initial={savedStore('owner@account.test', null)} />)
    const field = screen.getByLabelText('Public business email')
    await userEvent.clear(field)
    await userEvent.type(field, 'shop@business.test')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Will show on your storefront when you save.')).toBeInTheDocument()
  })

  it('shows a confirmed address as published', () => {
    render(<Harness initial={savedStore('shop@business.test', '2026-11-01T00:00:00.000Z')} />)
    expect(screen.getByText('Shown on your storefront.')).toBeInTheDocument()
  })
})
