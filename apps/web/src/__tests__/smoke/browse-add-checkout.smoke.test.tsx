import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'

import { ItemCard } from '@/features/products/components/ItemCard/ItemCard'
import CartPage from '@/pages/shared/Cart.page'
import CheckoutPage from '@/pages/shared/Checkout.page'

// Mock API client calls that would otherwise hit the network during tests.
vi.mock('@/api/client', () => ({
  apiClient: {
    carts: () => ({
      createCart: vi.fn(async () => ({})),
    }),
    orders: () => ({
      createOrder: vi.fn(async () => ({ id: 'order_1' })),
    }),
    setToken: vi.fn(),
  },
}))

// ItemCard uses useAddToCart -> which attempts a best-effort API sync. We mocked apiClient above.

describe('smoke: browse -> add -> checkout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 't',
      user: { id: 'u1', email: 'a@b.com', role: 'USER' } as any,
    })
    useCartStore.setState({ cart: undefined, hasHydrated: true } as any)
  })

  it('can add an item to cart and reach checkout (not empty)', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ItemCard
            item={{
              id: 'item_1',
              storeId: 'store_1',
              title: 'Burger',
              description: 'Tasty',
              price: '10.00',
              isActive: true,
              isSoldOut: false,
            } as any}
            store={{ id: 'store_1', name: 'Test Store' }}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Add to cart
    const add = await screen.findByRole('button', { name: /add to cart/i })
    await user.click(add)

    // Unmount the product card UI. Zustand state remains in-memory for the test.
    cleanup()

    // Render cart in the same test process (state is persisted in zustand store)
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/cart']}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Cart header renders: "Items (1)" (parentheses are literal)
    expect(await screen.findByText(/items \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/burger/i)).toBeInTheDocument()

    // Checkout page should not show empty state now
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument()
    expect(await screen.findByText(/checkout/i)).toBeInTheDocument()
  })
})
