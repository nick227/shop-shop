import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useCartStore } from '@stores/cartStore'
import { useAddToCart } from './useAddToCart'

const mocks = vi.hoisted(() => ({
  showItemAddedMock: vi.fn(),
}))

vi.mock('@features/cart/components/CartToaster', () => ({
  useCartToaster: () => ({
    showItemAdded: mocks.showItemAddedMock,
  }),
}))

vi.mock('@api/errors', () => ({
  handleApiError: vi.fn(async (error: unknown) => ({
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAddToCart', () => {
  beforeEach(() => {
    mocks.showItemAddedMock.mockReset()
    useCartStore.setState({ cart: undefined, hasHydrated: true })
  })

  it('updates cart state immediately and shows a cart toaster', async () => {
    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() })

    result.current.mutate({
      storeId: 'store_1',
      itemId: 'item_1',
      quantity: 1,
      title: 'Burger',
      unitPrice: '10.00',
      item: { id: 'item_1', title: 'Burger', price: '10.00' },
    })

    await waitFor(() => {
      expect(useCartStore.getState().cart?.itemCount).toBe(1)
    })
    expect(mocks.showItemAddedMock).toHaveBeenCalledTimes(1)
  })

  it('propagates errors from the cart store', async () => {
    const originalAddItem = useCartStore.getState().addItem
    useCartStore.setState({
      addItem: () => {
        throw new Error('Sync failed')
      },
    })

    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() })

    await expect(
      result.current.mutateAsync({
        storeId: 'store_1',
        itemId: 'item_1',
        quantity: 1,
        title: 'Burger',
        unitPrice: '10.00',
        item: { id: 'item_1', title: 'Burger', price: '10.00' },
      }),
    ).rejects.toThrow('Sync failed')

    expect(useCartStore.getState().cart).toBeUndefined()
    expect(mocks.showItemAddedMock).not.toHaveBeenCalled()

    useCartStore.setState({ addItem: originalAddItem })
  })

  it('does not rollback previous adds when a later add fails', async () => {
    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() })

    result.current.mutate({
      storeId: 'store_1',
      itemId: 'item_1',
      quantity: 1,
      title: 'Burger',
      unitPrice: '10.00',
      item: { id: 'item_1', title: 'Burger', price: '10.00' },
    })
    result.current.mutate({
      storeId: 'store_1',
      itemId: 'item_1',
      quantity: 1,
      title: 'Burger',
      unitPrice: '10.00',
      item: { id: 'item_1', title: 'Burger', price: '10.00' },
    })

    await waitFor(() => {
      expect(useCartStore.getState().cart?.itemCount).toBe(2)
    })

    const originalAddItem = useCartStore.getState().addItem
    useCartStore.setState({
      addItem: () => {
        throw new Error('Third call failed')
      },
    })

    await expect(
      result.current.mutateAsync({
        storeId: 'store_1',
        itemId: 'item_1',
        quantity: 1,
        title: 'Burger',
        unitPrice: '10.00',
        item: { id: 'item_1', title: 'Burger', price: '10.00' },
      }),
    ).rejects.toThrow('Third call failed')

    await waitFor(() => {
      expect(useCartStore.getState().cart?.itemCount).toBe(2)
    })
    useCartStore.setState({ addItem: originalAddItem })
  })
})
