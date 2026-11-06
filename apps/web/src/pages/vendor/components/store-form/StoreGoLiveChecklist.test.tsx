import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { StoreGoLiveChecklist } from './StoreGoLiveChecklist'

const request = vi.fn()
vi.mock('@shared/hooks/hooks/vendor/useVendorTeamRequest', () => ({ useVendorTeamRequest: () => request }))

function show(storeId?: string, enabled = true) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <StoreGoLiveChecklist storeId={storeId} enabled={enabled} />
  </QueryClientProvider>)
}

describe('go-live checklist', () => {
  it('shows each missing requirement as a separate list item', async () => {
    request.mockResolvedValue({ canPublish: false, missingRequirements: ['phone number', 'store photo or media'] })
    show('store-1')
    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('phone number')).toBeInTheDocument()
    expect(screen.getByText('store photo or media')).toBeInTheDocument()
  })
  it('uses failed required checks when the server omits missingRequirements', async () => {
    request.mockResolvedValue({ canPublish: false, checks: [
      { required: true, passed: false, label: 'Products/menu', message: 'Add at least one active product.' },
      { required: true, passed: false, label: 'Store photo' },
      { required: true, passed: true, label: 'Address' },
      { required: false, passed: false, label: 'Optional field' },
    ] })
    show('legacy-store')
    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Add at least one active product.')).toBeInTheDocument()
    expect(screen.getByText('Store photo')).toBeInTheDocument()
    expect(screen.queryByText(/Optional field/)).not.toBeInTheDocument()
  })
  it.each([undefined, null, []])('handles unavailable requirement details (%s)', async (missingRequirements) => {
    request.mockResolvedValue({ canPublish: false, missingRequirements })
    show('incomplete-response')
    expect(await screen.findByText(/Requirements unavailable/)).toBeInTheDocument()
  })
  it('keeps the checklist available while disabled', async () => {
    request.mockResolvedValue({ canPublish: false, missingRequirements: ['description'] })
    show('store-2', false)
    expect(await screen.findByText('description')).toBeInTheDocument()
  })
  it('confirms readiness', async () => {
    request.mockResolvedValue({ canPublish: true, missingRequirements: [] })
    show('store-3')
    expect(await screen.findByText(/Ready to publish/)).toBeInTheDocument()
  })
  it('offers retry if checking fails', async () => {
    request.mockRejectedValue(new Error('offline'))
    show('store-4')
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
  it('explains the first step for a new store', () => {
    show()
    expect(screen.getByText(/Save store to check requirements/)).toBeInTheDocument()
  })
})
