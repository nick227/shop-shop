import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useCartStore } from '@stores/cartStore'
import { useAddToCart } from './useAddToCart'

const mocks = vi.hoisted(() => ({
  createCartMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('@api/client', () => ({
  apiClient: {
    carts: () => ({
      createCart: mocks.createCartMock,
    }),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccessMock,
    error: mocks.toastErrorMock,
  },
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
    mocks.createCartMock.mockReset()
    mocks.toastSuccessMock.mockReset()
    mocks.toastErrorMock.mockReset()
    useCartStore.setState({ cart: undefined, hasHydrated: true })
  })

  it('updates cart state immediately before API resolution', async () => {
    let resolveRequest: (() => void) | undefined
    mocks.createCartMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve
        }),
    )

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
    expect(mocks.toastSuccessMock).not.toHaveBeenCalled()

    resolveRequest?.()

    await waitFor(() => {
      expect(mocks.toastSuccessMock).toHaveBeenCalledWith('Item added to cart!')
    })
  })

  it('rolls back cart and shows feedback when API sync fails', async () => {
    mocks.createCartMock.mockRejectedValue(new Error('Sync failed'))

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
    expect(mocks.toastErrorMock).toHaveBeenCalledWith('Sync failed')
    expect(mocks.toastSuccessMock).not.toHaveBeenCalled()
  })

  it('does not rollback newer optimistic adds when an earlier request fails', async () => {
    let firstReject: ((error: unknown) => void) | undefined
    let secondResolve: (() => void) | undefined
    let thirdResolve: (() => void) | undefined

    mocks.createCartMock
      .mockImplementationOnce(
        () =>
          new Promise<void>((_, reject) => {
            firstReject = reject
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            secondResolve = resolve
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            thirdResolve = resolve
          }),
      )

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
    result.current.mutate({
      storeId: 'store_1',
      itemId: 'item_1',
      quantity: 1,
      title: 'Burger',
      unitPrice: '10.00',
      item: { id: 'item_1', title: 'Burger', price: '10.00' },
    })

    await waitFor(() => {
      expect(useCartStore.getState().cart?.itemCount).toBe(3)
    })

    firstReject?.(new Error('First call failed'))
    secondResolve?.()
    thirdResolve?.()

    await waitFor(() => {
      expect(useCartStore.getState().cart?.itemCount).toBe(3)
    })
    expect(mocks.toastErrorMock).toHaveBeenCalledWith('First call failed')
  })
})
