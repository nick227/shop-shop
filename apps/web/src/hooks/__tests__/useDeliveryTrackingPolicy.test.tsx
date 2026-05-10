import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useDeliveryTrackingPolicy } from '../useDeliveryTrackingPolicy'

const realtimeClient = {
  connect: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  subscribeOrder: vi.fn(() => vi.fn()),
  subscribeVendor: vi.fn(() => vi.fn()),
  subscribeCustomer: vi.fn(() => vi.fn()),
  on: vi.fn(() => vi.fn()),
  isConnected: vi.fn(() => false),
  getSubscriptions: vi.fn(() => []),
}

vi.mock('@services/realtimeClient', () => ({
  getRealtimeClient: () => realtimeClient,
}))

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useDeliveryTrackingPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVisibilityState('visible')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables realtime and polling for terminal deliveries', () => {
    const { result } = renderHook(() => useDeliveryTrackingPolicy({
      surface: 'customer-tracking',
      orderId: 'order-1',
      terminal: true,
      serverNextPollMs: 10_000,
    }), { wrapper })

    expect(result.current.shouldUseRealtime).toBe(false)
    expect(result.current.pollIntervalMs).toBe(false)
    expect(realtimeClient.connect).not.toHaveBeenCalled()
  })

  it('clamps server nextPollMs to the supported interval range', () => {
    const tooFast = renderHook(() => useDeliveryTrackingPolicy({
      surface: 'customer-tracking',
      orderId: 'order-1',
      serverNextPollMs: 500,
    }), { wrapper })

    expect(tooFast.result.current.pollIntervalMs).toBe(5_000)
    tooFast.unmount()

    const tooSlow = renderHook(() => useDeliveryTrackingPolicy({
      surface: 'customer-tracking',
      orderId: 'order-1',
      serverNextPollMs: 120_000,
    }), { wrapper })

    expect(tooSlow.result.current.pollIntervalMs).toBe(60_000)
  })

  it('uses a sane fallback when nextPollMs is missing or bad', () => {
    const { result } = renderHook(() => useDeliveryTrackingPolicy({
      surface: 'customer-tracking',
      orderId: 'order-1',
      serverNextPollMs: null,
    }), { wrapper })

    expect(result.current.pollIntervalMs).toBe(15_000)
  })

  it('pauses customer realtime and polling while the page is hidden', () => {
    setVisibilityState('hidden')

    const { result } = renderHook(() => useDeliveryTrackingPolicy({
      surface: 'customer-tracking',
      orderId: 'order-1',
    }), { wrapper })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.shouldUseRealtime).toBe(false)
    expect(result.current.pollIntervalMs).toBe(false)
  })

  it('admin live mode idles based on meaningful delivery interactions', () => {
    vi.useFakeTimers()
    const onAdminIdle = vi.fn()

    const { result } = renderHook(() => useDeliveryTrackingPolicy({
      surface: 'admin-delivery',
      liveMode: true,
      adminIdleMs: 60_000,
      onAdminIdle,
    }), { wrapper })

    act(() => {
      vi.advanceTimersByTime(45_000)
    })

    act(() => {
      result.current.markMeaningfulInteraction()
    })

    act(() => {
      vi.advanceTimersByTime(45_000)
    })

    expect(onAdminIdle).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(15_000)
    })

    expect(onAdminIdle).toHaveBeenCalledTimes(1)
  })
})
