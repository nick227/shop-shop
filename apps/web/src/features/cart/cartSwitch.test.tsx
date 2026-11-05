import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartStoreConflictError, useCartStore } from '@stores/cartStore'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { useAddBundleToCart } from '@shared/hooks/hooks/useAddBundleToCart'
import { CartSwitchDialog } from './cartSwitch'

vi.mock('@features/cart/components/CartToaster', () => ({ useCartToaster: () => ({ showItemAdded: vi.fn() }) }))

const tacoFromA = { storeId: 'a', itemId: 'taco', quantity: 1, title: 'Taco', unitPrice: '3.00' }
const cartStore = () => useCartStore.getState().cart

function Harness() {
  const addItem = useAddToCart()
  const addBundle = useAddBundleToCart()
  return (
    <>
      <button type="button" onClick={() => addItem.mutate({ storeId: 'b', itemId: 'pie', quantity: 1, title: 'Pie', unitPrice: '5.00' })}>
        Add pie from B
      </button>
      <button type="button" onClick={() => addBundle.mutate({ storeId: 'b', bundleId: 'box', title: 'Box', unitPrice: 12 })}>
        Add box from B
      </button>
      <CartSwitchDialog />
    </>
  )
}

const renderHarness = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness />
    </QueryClientProvider>,
  )

beforeEach(() => {
  act(() => useCartStore.getState().clearCart())
  act(() => {
    useCartStore.getState().addItem(tacoFromA)
  })
})

describe('cart store', () => {
  it('never replaces another store’s cart without the shopper’s say-so', () => {
    expect(() => useCartStore.getState().addItem({ ...tacoFromA, storeId: 'b', itemId: 'pie' })).toThrow(CartStoreConflictError)
    expect(cartStore()?.storeId).toBe('a')
    useCartStore.getState().addItem({ ...tacoFromA, storeId: 'b', itemId: 'pie', replaceCart: true })
    expect(cartStore()?.storeId).toBe('b')
  })

  it('adds to the same store’s cart freely', () => {
    useCartStore.getState().addItem({ ...tacoFromA, quantity: 2 })
    expect((cartStore()?.items as { quantity: number }[])[0].quantity).toBe(3)
  })
})

describe('adding from another store', () => {
  it('keeps the current cart when the shopper says keep', async () => {
    renderHarness()
    await userEvent.click(screen.getByRole('button', { name: 'Add pie from B' }))
    expect(await screen.findByText('Your cart contains items from another store. Start a new cart for this store?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Keep current cart' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(cartStore()?.storeId).toBe('a')
    expect(cartStore()?.items).toHaveLength(1)
  })

  it('treats closing the question as keeping the cart', async () => {
    renderHarness()
    await userEvent.click(screen.getByRole('button', { name: 'Add box from B' }))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(cartStore()?.storeId).toBe('a')
  })

  it('starts a new cart only when the shopper chooses to', async () => {
    renderHarness()
    await userEvent.click(screen.getByRole('button', { name: 'Add pie from B' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Start new cart' }))
    await waitFor(() => expect(cartStore()?.storeId).toBe('b'))
    expect((cartStore()?.items as { itemId: string }[]).map((line) => line.itemId)).toEqual(['pie'])
  })
})
