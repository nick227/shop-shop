import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { VendorAccessBoundary } from './VendorAccessBoundary'
import { VendorEnrollmentSetting } from './VendorEnrollmentSetting'
import { accountCapabilitiesKey } from './useAccountCapabilities'
import { VendorStoreManager } from '@components/header/VendorStoreManager'
import { RailNav, DrawerNav } from '@features/home/shell/ShopNav'
import { useVendorStores } from '@shared/hooks/hooks/vendor/useVendorStores'
import { AccountMenu } from '@layouts/VendorLayout/AccountMenu'
import type { AccountCapabilities } from '@packages/schemas'

vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: useAuthStore.getState().user, logout: vi.fn() }) }))
const shopper: AccountCapabilities = { platformRole: 'USER', vendorEnrollment: 'NONE', vendorAccessRevoked: false, canAccessVendorPortal: false, canCreateStore: false, canAdministerStores: false }
const vendor = { ...shopper, vendorEnrollment: 'APPROVED', canAccessVendorPortal: true, canCreateStore: true } as AccountCapabilities
const staff = { ...shopper, canAccessVendorPortal: true }
let current: AccountCapabilities
let client: QueryClient
let requests: string[]

function ManagedStoresProbe() {
  const query = useVendorStores()
  return <output>{query.data?.length ?? 0} managed stores</output>
}
function mount(element: React.ReactNode, path = '/') {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>{element}</MemoryRouter></QueryClientProvider>)
}
function routes() {
  return <Routes>
    <Route path="/" element={<p>Shopping home</p>} />
    <Route path="/vendor/apply" element={<Navigate to="/vendor/new" replace />} />
    <Route path="/vendor/stores/new" element={<Navigate to="/vendor/new" replace />} />
    <Route path="/vendor/new" element={<VendorAccessBoundary><VendorAccessBoundary createStore><p>Create store form</p></VendorAccessBoundary></VendorAccessBoundary>} />
    <Route path="/vendor/*" element={<VendorAccessBoundary><p>Assigned workspace</p></VendorAccessBoundary>} />
  </Routes>
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  current = { ...shopper }
  requests = []
  useAuthStore.setState({ user: { id: 'shopper-id', email: 'shopper@test.com', role: 'USER' } as never, token: 'test-token', isAuthenticated: true })
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    requests.push(url)
    if (url.includes('/api/auth/v1/capabilities')) return new Response(JSON.stringify(current), { status: 200 })
    if (url.includes('/api/account/vendor-enrollment')) { current = vendor; return new Response(JSON.stringify(vendor), { status: 200 }) }
    if (url.includes('/api/team/me/stores')) return new Response(JSON.stringify({ stores: [] }), { status: 200 })
    throw new Error(`Unexpected request: ${url}`)
  }))
})
afterEach(() => { cleanup(); client.clear(); vi.unstubAllGlobals() })

describe('Vendor access boundary', () => {
  it('shows no seller controls or merchant API traffic to shoppers, including mobile navigation and account menu', async () => {
    mount(<><RailNav /><DrawerNav onNavigate={() => {}} /><VendorStoreManager /><ManagedStoresProbe /><AccountMenu /></>)
    await waitFor(() => expect(requests.some((url) => url.includes('/capabilities'))).toBe(true))
    await userEvent.click(screen.getByRole('button', { name: 'Your account' }))
    expect(screen.queryByText('Vendor Portal')).not.toBeInTheDocument()
    expect(screen.queryByText(/Sell on ShopShop|Create Store|Become a vendor/i)).not.toBeInTheDocument()
    expect(requests.every((url) => url.includes('/api/auth/v1/capabilities'))).toBe(true)
  })
  it.each(['/vendor', '/vendor/new', '/vendor/stores/new', '/vendor/apply', '/vendor/foreign-store/orders'])('blocks shopper deep link %s', async (path) => {
    mount(routes(), path)
    expect(await screen.findByText('Shopping home')).toBeInTheDocument()
    expect(screen.queryByText(/Assigned workspace|Create store form/)).not.toBeInTheDocument()
  })
  it('gives staff workspace access but redirects create-store links', async () => {
    current = staff
    mount(routes(), '/vendor/new')
    expect(await screen.findByText('Assigned workspace')).toBeInTheDocument()
    expect(screen.queryByText('Create store form')).not.toBeInTheDocument()
  })
  it('exposes the portal only after explicitly enabling enrollment in settings', async () => {
    mount(<><VendorEnrollmentSetting /><VendorStoreManager /></>)
    await userEvent.click(await screen.findByText('Become a vendor'))
    expect(screen.queryByText('Vendor Portal')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enable vendor account' }))
    expect(await screen.findByText('Vendor Portal')).toBeInTheDocument()
    expect(screen.getByText(/Your vendor account is active/)).toBeInTheDocument()
    expect(useAuthStore.getState().user?.role).toBe('USER')
  })
  it('removes mounted workspace when a live capability refresh revokes access', async () => {
    current = vendor
    mount(routes(), '/vendor/new')
    expect(await screen.findByText('Create store form')).toBeInTheDocument()
    current = { ...shopper, vendorAccessRevoked: true }
    await client.invalidateQueries({ queryKey: accountCapabilitiesKey('shopper-id') })
    expect(await screen.findByText('Shopping home')).toBeInTheDocument()
    expect(screen.queryByText('Create store form')).not.toBeInTheDocument()
  })
  it('fails closed when capability lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
    mount(routes(), '/vendor')
    expect(await screen.findByText('Account access could not be checked.')).toBeInTheDocument()
    expect(screen.queryByText('Assigned workspace')).not.toBeInTheDocument()
  })
})
