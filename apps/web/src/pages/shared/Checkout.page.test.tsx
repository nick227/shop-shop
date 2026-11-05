import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CheckoutPage from './Checkout.page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@shared/hooks/hooks/useCart', () => ({
  useCart: () => ({
    cart: { id: 'cart-1', storeId: 's1', itemCount: 2, subtotal: 20, items: [{ itemId: 'i1', quantity: 2 }] },
    isLoading: false,
    clearCart: vi.fn(),
  }),
}))
vi.mock('@shared/hooks/hooks/useStores', () => ({
  useStore: () => ({ data: { id: 's1', name: 'Northside Kitchen', addressStreet: '5300 N Lamar Blvd', addressCity: 'Austin', addressState: 'TX', addressZip: '78751', prepTimeMin: 20 } }),
}))
vi.mock('@features/checkout/components/PaymentSection/PaymentSection', () => ({
  PaymentSection: ({ amount }: { amount: number }) => <div data-testid="payment">Pay ${amount.toFixed(2)}</div>,
}))
let signedIn = false
vi.mock('@stores/authStore', () => ({ useAuthStore: (select: (s: { token?: string }) => unknown) => select({ token: signedIn ? 't' : undefined }) }))

type Body = { deliveryType: 'PICKUP' | 'DELIVERY'; deliveryAddress?: { postalCode: string }; deliveryAddressId?: string; tipAmount: number }
const quoteFor = (body: Body) => {
  const delivering = body.deliveryType === 'DELIVERY'
  const zip = body.deliveryAddress?.postalCode ?? (body.deliveryAddressId ? '78751' : undefined)
  const base = {
    storeId: 's1',
    deliveryType: body.deliveryType,
    lines: [{ itemId: 'i1', bundleId: null, title: 'Chicken Sandwich', quantity: 2, unitPrice: 10 }],
    subtotal: 20,
    serviceFee: 0,
    tip: body.tipAmount,
    taxEstimated: true,
    fulfillment: { pickup: { available: true }, delivery: { available: true, fee: 3, minimum: 15, distanceMiles: 1.2 } },
    destination: zip ? { addressId: body.deliveryAddressId ?? null, address: { line1: '4500 Duval St', city: 'Austin', state: 'TX', postalCode: zip }, approximate: true } : null,
  }
  if (delivering && !zip) {
    return { ...base, deliveryFee: 0, tax: 1.65, total: 21.65 + body.tipAmount, blocked: { code: 'ADDRESS_REQUIRED', message: 'Add a delivery address.' } }
  }
  if (delivering && zip === '78701') {
    const message = 'This address is 3 miles away; the store delivers within 2 miles.'
    return { ...base, deliveryFee: 0, tax: 1.65, total: 21.65, blocked: { code: 'OUTSIDE_DELIVERY_AREA', message }, fulfillment: { ...base.fulfillment, delivery: { available: false, code: 'OUTSIDE_DELIVERY_AREA', message, minimum: 15, shortBy: null } } }
  }
  if (delivering) return { ...base, deliveryFee: 3, tax: 1.9, total: 24.9 + body.tipAmount, blocked: null }
  return { ...base, deliveryFee: 0, tax: 1.65, total: 21.65 + body.tipAmount, blocked: null }
}

const bodies: Body[] = []
const authPost = vi.fn(async (url: string, body: unknown) => {
  if (url.includes('/checkout/quote')) {
    bodies.push(body as Body)
    return { ok: true, json: async () => quoteFor(body as Body) }
  }
  return { ok: true, json: async () => ({ data: { id: 'addr-new', label: null, isDefault: false, ...(body as object) } }) }
})
const authGet = vi.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }))
vi.mock('@shared/lib/auth/authFetch', () => ({
  authPost: (url: string, body: unknown) => authPost(url, body),
  authGet: () => authGet(),
}))

function renderCheckout() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const summary = () => screen.getAllByRole('region', { name: 'Order summary' })[0]

beforeEach(() => {
  sessionStorage.clear()
  bodies.length = 0
  signedIn = false
  authGet.mockImplementation(async () => ({ ok: true, json: async () => ({ data: [] }) }))
})

describe('CheckoutPage', () => {
  it('starts with pickup at the store, the quoted total and payment ready', async () => {
    renderCheckout()
    expect(await screen.findByText('Northside Kitchen')).toBeInTheDocument()
    expect(screen.getByText(/ready in about 20 min/)).toBeInTheDocument()
    expect(await within(summary()).findByText('$21.65')).toBeInTheDocument()
    expect(within(summary()).getByText('Estimated tax')).toBeInTheDocument()
    expect(await screen.findByTestId('payment')).toHaveTextContent('Pay $21.65')
  })

  it('asks for an address for delivery, then shows the delivery fee and total', async () => {
    renderCheckout()
    await userEvent.click(await screen.findByRole('radio', { name: 'Delivery' }))
    expect(await screen.findByText('Add a delivery address to continue.')).toBeInTheDocument()
    expect(screen.queryByTestId('payment')).not.toBeInTheDocument()

    const form = screen.getByRole('form', { name: 'Delivery address' })
    await userEvent.type(within(form).getByLabelText('Street address'), '4500 Duval St')
    await userEvent.type(within(form).getByLabelText('Apt or unit'), '2B')
    await userEvent.type(within(form).getByLabelText('City'), 'Austin')
    await userEvent.type(within(form).getByLabelText('State'), 'tx')
    await userEvent.type(within(form).getByLabelText('ZIP code'), '78751')
    await userEvent.click(within(form).getByRole('button', { name: 'Use this address' }))

    expect(await within(summary()).findByText('$24.90', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(within(summary()).getByText('Delivery')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
    expect(bodies.at(-1)).toMatchObject({ deliveryType: 'DELIVERY', deliveryAddress: { line2: '2B', state: 'TX', postalCode: '78751' } })
  })

  it('explains an address outside the area, keeps it editable, and offers pickup', async () => {
    renderCheckout()
    await userEvent.click(await screen.findByRole('radio', { name: 'Delivery' }))
    const form = screen.getByRole('form', { name: 'Delivery address' })
    await userEvent.type(within(form).getByLabelText('Street address'), '100 Congress Ave')
    await userEvent.type(within(form).getByLabelText('City'), 'Austin')
    await userEvent.type(within(form).getByLabelText('State'), 'TX')
    await userEvent.type(within(form).getByLabelText('ZIP code'), '78701')
    await userEvent.click(within(form).getByRole('button', { name: 'Use this address' }))

    const alert = await screen.findByText(/delivers within 2 miles/)
    expect(screen.queryByTestId('payment')).not.toBeInTheDocument()
    const notice = alert.closest('[role="alert"]') as HTMLElement
    await userEvent.click(within(notice).getByRole('button', { name: 'Use a different address' }))
    // The typed address is still there to fix.
    expect(screen.getByLabelText('Street address')).toHaveValue('100 Congress Ave')
    await userEvent.click(screen.getByRole('radio', { name: 'Pickup' }))
    expect(await screen.findByTestId('payment')).toBeInTheDocument()
  })

  it('validates the address form without losing what was typed', async () => {
    renderCheckout()
    await userEvent.click(await screen.findByRole('radio', { name: 'Delivery' }))
    const form = screen.getByRole('form', { name: 'Delivery address' })
    await userEvent.type(within(form).getByLabelText('Street address'), '4500 Duval St')
    await userEvent.click(within(form).getByRole('button', { name: 'Use this address' }))
    expect(within(form).getByRole('alert')).toHaveTextContent(/two-letter state/)
    expect(within(form).getByLabelText('Street address')).toHaveValue('4500 Duval St')
  })

  it('lets a signed-in shopper pick a saved address in one tap', async () => {
    signedIn = true
    authGet.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ data: [{ id: 'home', label: 'Home', isDefault: true, line1: '4500 Duval St', city: 'Austin', state: 'TX', postalCode: '78751' }] }),
    }))
    renderCheckout()
    await userEvent.click(await screen.findByRole('radio', { name: 'Delivery' }))
    await waitFor(() => expect(bodies.at(-1)).toMatchObject({ deliveryAddressId: 'home' }))
    expect(await screen.findByTestId('payment')).toHaveTextContent('Pay $24.90')
  })

  it('remembers the choice of delivery across visits to the page', async () => {
    const first = renderCheckout()
    await userEvent.click(await screen.findByRole('radio', { name: 'Delivery' }))
    first.unmount()
    renderCheckout()
    expect(await screen.findByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true')
  })
})
