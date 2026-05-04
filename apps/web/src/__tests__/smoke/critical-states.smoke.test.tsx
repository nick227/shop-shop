import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Pages
import CartPage from '@/pages/shared/Cart.page'
import CheckoutPage from '@/pages/shared/Checkout.page'

describe('smoke: critical empty/error states', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 't',
      user: { id: 'u1', email: 'a@b.com', role: 'USER' } as any,
    })
  })

  it('Cart page shows empty state when no cart exists', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/cart']}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument()
  })

  it('Checkout page shows empty state when no cart exists', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument()
  })
})
