import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { VendorActiveStoreProvider } from '@layouts/VendorLayout/VendorActiveStoreContext'
import VendorTeamPage from './Team.page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const request = vi.fn()
vi.mock('@shared/hooks/hooks/vendor', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/hooks/hooks/vendor')>()),
  useVendorTeamRequest: () => request,
}))

const members = [
  { id: 'm1', permissionsJson: ['FULL_ACCESS'], user: { name: 'Ana Manager', email: 'ana@x.test' } },
  { id: 'm2', permissionsJson: ['VIEW_ITEMS', 'MANAGE_ITEMS'], user: { name: 'Mo Menu', email: 'mo@x.test' } },
  { id: 'm3', permissionsJson: ['VIEW_DELIVERIES', 'MANAGE_DELIVERIES'], user: { name: 'Dee Driver', email: 'dee@x.test' } },
]
const invitations = [
  { id: 'i1', recipientEmail: 'staff@x.test', expiresAt: '2026-12-01', token: 't1', permissionsJson: ['VIEW_ORDERS', 'MANAGE_ORDERS'] },
  { id: 'i2', recipientEmail: 'driver@x.test', expiresAt: '2026-12-01', token: 't2', permissionsJson: ['VIEW_DELIVERIES', 'MANAGE_DELIVERIES'] },
]

const store = { id: 's1', name: 'Northside Bakery', isPublished: true, status: 'ACTIVE', permissions: ['FULL_ACCESS'], isOwner: true } as unknown as VendorStore

function Where() {
  return <output aria-label="location">{useLocation().pathname}</output>
}

function renderTeam(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/vendor/:storeId/*',
        element: (
          <VendorActiveStoreProvider stores={[store]}>
            <VendorTeamPage />
            <Where />
          </VendorActiveStoreProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  request.mockReset()
  request.mockImplementation(async (path: string) => {
    if (path.endsWith('/members')) return { members }
    if (path.endsWith('/drivers')) return { drivers: [members[2]] }
    if (path.endsWith('/invitations')) return { invitations }
    return {}
  })
})

describe('Team', () => {
  it('lists staff without driver-only members, and only staff invitations', async () => {
    renderTeam('/vendor/s1/team')
    expect(await screen.findByText('Ana Manager')).toBeInTheDocument()
    expect(screen.getByText('Mo Menu')).toBeInTheDocument()
    expect(screen.queryByText('Dee Driver')).not.toBeInTheDocument()
    expect(screen.getByText('staff@x.test')).toBeInTheDocument()
    expect(screen.queryByText('driver@x.test')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Staff/, selected: true })).toBeInTheDocument()
  })

  it('switches to the Drivers tab by URL and defaults invitations to the Driver role', async () => {
    const user = userEvent.setup()
    renderTeam('/vendor/s1/team')
    await screen.findByText('Ana Manager')

    await user.click(screen.getByRole('tab', { name: /Drivers/ }))
    expect(screen.getByLabelText('location')).toHaveTextContent('/vendor/s1/team/drivers')
    expect(await screen.findByText('Dee Driver')).toBeInTheDocument()
    expect(screen.getByText('driver@x.test')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toHaveValue('DRIVER')

    await user.type(screen.getByLabelText(/Email/), 'new@x.test')
    await user.click(screen.getByRole('button', { name: 'Send invitation' }))
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith('/team/invitations', expect.objectContaining({ method: 'POST' })),
    )
    const body = JSON.parse(request.mock.calls.find(([path]) => path === '/team/invitations')![1].body as string)
    expect(body).toMatchObject({
      storeId: 's1',
      recipientEmail: 'new@x.test',
      permissions: ['VIEW_DELIVERIES', 'MANAGE_DELIVERIES'],
    })
  })

  it('keeps distinct role permissions when inviting staff', async () => {
    const user = userEvent.setup()
    renderTeam('/vendor/s1/team')
    await screen.findByText('Ana Manager')
    await user.selectOptions(screen.getByLabelText('Role'), 'FINANCE')
    await user.type(screen.getByLabelText(/Email/), 'cfo@x.test')
    await user.click(screen.getByRole('button', { name: 'Send invitation' }))
    await waitFor(() => expect(request.mock.calls.some(([path]) => path === '/team/invitations')).toBe(true))
    const body = JSON.parse(request.mock.calls.find(([path]) => path === '/team/invitations')![1].body as string)
    expect(body.permissions).toEqual(['VIEW_ORDERS', 'VIEW_FINANCE'])
  })

  it('removes only delivery access from the Drivers tab, after confirming', async () => {
    const user = userEvent.setup()
    renderTeam('/vendor/s1/team/drivers')
    await user.click(await screen.findByRole('button', { name: 'Remove Dee Driver' }))
    expect(screen.getByText('Remove driver access?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(request).toHaveBeenCalledWith('/team/members/m3', { method: 'DELETE' }))
  })
})
