import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { StoreDirectory } from './StoreDirectory'

function store(overrides: Pick<VendorStore, 'id' | 'name' | 'isPublished'> & Partial<VendorStore>): VendorStore {
  return {
    description: '',
    addressCity: null,
    addressState: null,
    status: 'ACTIVE',
    ...overrides,
  } as VendorStore
}

const stores = [
  store({
    id: 'draft',
    name: 'Draft Kitchen',
    isPublished: false,
    addressCity: 'Austin',
    addressState: 'TX',
  }),
  store({
    id: 'live',
    name: 'Live Kitchen',
    isPublished: true,
    addressCity: 'Dallas',
    addressState: 'TX',
  }),
]

describe('StoreDirectory', () => {
  it('opens a store from its row and filters by status', async () => {
    const onOpen = vi.fn()
    const onSettings = vi.fn()
    const user = userEvent.setup()

    render(<StoreDirectory stores={stores} currentStoreId="live" onOpen={onOpen} onSettings={onSettings} />)

    expect(screen.getByRole('radio', { name: 'All 2' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Open · Dallas, TX · Current')).toBeInTheDocument()
    expect(screen.getByText('Draft · Austin, TX')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /working store/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open Draft Kitchen' }))
    expect(onOpen).toHaveBeenCalledWith('draft')

    await user.click(screen.getAllByRole('button', { name: 'Settings' })[1])
    expect(onSettings).toHaveBeenCalledWith('live')

    await user.click(screen.getByRole('radio', { name: 'Drafts 1' }))
    expect(screen.queryByText('Live Kitchen')).not.toBeInTheDocument()
    expect(screen.getByText('Draft Kitchen')).toBeInTheDocument()
  })
})
