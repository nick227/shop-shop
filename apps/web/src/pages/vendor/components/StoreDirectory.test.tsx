import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { StoreResponse } from '@api/types'
import { StoreDirectory } from './StoreDirectory'

vi.mock('./ActiveStoreOperations', () => ({
  ActiveStoreOperations: ({ storeName }: { storeName: string }) => <div>Payments for {storeName}</div>,
}))

function store(overrides: Pick<StoreResponse, 'id' | 'name' | 'isPublished'> & Partial<StoreResponse>): StoreResponse {
  return {
    description: '',
    addressCity: null,
    addressState: null,
    status: 'ACTIVE',
    ...overrides,
  } as StoreResponse
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
  it('lists stores in one directory and keeps payments on the working store', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <StoreDirectory
        stores={stores}
        selectedStoreId="live"
        onSelect={onSelect}
        onOpenMenu={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByRole('tab', { name: 'All 2' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Published 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Drafts 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Live Kitchen is the working store' })).toBeInTheDocument()
    expect(screen.getByText('Payments for Live Kitchen')).toBeInTheDocument()
    expect(screen.queryByText('Payments for Draft Kitchen')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Work in Draft Kitchen' }))
    expect(onSelect).toHaveBeenCalledWith('draft')

    await user.click(screen.getByRole('tab', { name: 'Drafts 1' }))
    expect(screen.queryByText('Live Kitchen')).not.toBeInTheDocument()
    expect(screen.getByText('Draft Kitchen')).toBeInTheDocument()
  })
})
