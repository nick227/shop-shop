import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { readOrderAlertChoice, useOrderAlertPrefs } from './orderAlertPrefs'
import { useVendorRealtimeOrders } from './useVendorRealtimeOrders'
import type { VendorStore } from './vendorTeamApi'
import { VendorActiveStoreProvider } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { OrderAlertsDialog } from '@layouts/VendorLayout/OrderAlertsDialog'

const handlers = new Map<string, (event: { type: string; payload: unknown }) => void>()
vi.mock('@services/realtimeClient', () => ({
  getRealtimeClient: () => ({
    connect: () => Promise.resolve(),
    isConnected: () => true,
    subscribeVendor: (storeId: string, handler: (event: { type: string; payload: unknown }) => void) => {
      handlers.set(storeId, handler)
      return () => handlers.delete(storeId)
    },
  }),
}))

const toastMock = vi.hoisted(() => vi.fn())
vi.mock('sonner', () => ({ toast: toastMock }))

const play = vi.fn(() => Promise.resolve())
class FakeAudio {
  volume = 1
  currentTime = 0
  play = play
}
const notifications: string[] = []
class FakeNotification {
  static permission: NotificationPermission = 'granted'
  static requestPermission = vi.fn(() => Promise.resolve('granted' as NotificationPermission))
  constructor(title: string) {
    notifications.push(title)
  }
  addEventListener() {}
  close() {}
}

beforeEach(() => {
  localStorage.clear()
  handlers.clear()
  play.mockClear()
  toastMock.mockClear()
  notifications.length = 0
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('Notification', FakeNotification)
  FakeNotification.permission = 'granted'
})

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

function newOrder(storeId: string) {
  act(() => {
    handlers.get(storeId)?.({
      type: 'order.created',
      payload: { orderId: 'abcdef123456', storeId, customerName: 'Maya', customerId: 'u1', total: 14, deliveryType: 'PICKUP', status: 'PLACED' },
    })
  })
}

describe('order alert preferences', () => {
  it('alert only for the working store until another store is turned on', () => {
    expect(readOrderAlertChoice('north', 'north')).toEqual({ sound: true, desktop: true })
    expect(readOrderAlertChoice('south', 'north')).toEqual({ sound: false, desktop: false })

    const { result } = renderHook(() => useOrderAlertPrefs('north'))
    act(() => result.current.setChoice('south', { sound: true }))
    expect(result.current.choiceFor('south')).toEqual({ sound: true, desktop: false })
    act(() => result.current.setChoice('north', { desktop: false }))
    expect(readOrderAlertChoice('north', 'north')).toEqual({ sound: true, desktop: false })
  })
})

describe('useVendorRealtimeOrders', () => {
  it('shows every visible store, and rings or notifies only per that store’s choice', () => {
    renderHook(
      () =>
        useVendorRealtimeOrders({
          storeIds: ['north', 'south'],
          storeNames: { north: 'North', south: 'South' },
          alertsFor: (storeId) => readOrderAlertChoice(storeId, 'north'),
        }),
      { wrapper },
    )

    newOrder('south')
    expect(toastMock).toHaveBeenCalledWith('New order at South', expect.objectContaining({ description: expect.stringContaining('#ABCDEF12') }))
    expect(play).not.toHaveBeenCalled()
    expect(notifications).toEqual([])

    newOrder('north')
    expect(play).toHaveBeenCalledTimes(1)
    expect(notifications).toEqual(['North · New order'])
  })

  it('never asks for notification permission by itself', () => {
    FakeNotification.permission = 'default'
    renderHook(() => useVendorRealtimeOrders({ storeIds: ['north'], alertsFor: () => ({ sound: false, desktop: true }) }), { wrapper })
    newOrder('north')
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled()
    expect(notifications).toEqual([])
  })
})

describe('OrderAlertsDialog', () => {
  const stores = [
    { id: 'north', name: 'North', permissions: ['FULL_ACCESS'], isOwner: true },
    { id: 'south', name: 'South', permissions: ['VIEW_ORDERS'], isOwner: false },
    { id: 'menu', name: 'Menu Only', permissions: ['VIEW_ITEMS'], isOwner: false },
  ] as unknown as VendorStore[]

  it('lists only stores whose orders you can see and saves each switch', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/vendor/north']}>
        <VendorActiveStoreProvider stores={stores}>
          <OrderAlertsDialog open onOpenChange={vi.fn()} />
        </VendorActiveStoreProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('switch', { name: 'Sound for North' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: 'Sound for South' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByText('Menu Only')).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Sound for South' }))
    expect(readOrderAlertChoice('south', 'north').sound).toBe(true)
  })

  it('asks for desktop permission only when turning desktop alerts on', async () => {
    const user = userEvent.setup()
    FakeNotification.permission = 'default'
    render(
      <MemoryRouter initialEntries={['/vendor/north']}>
        <VendorActiveStoreProvider stores={stores}>
          <OrderAlertsDialog open onOpenChange={vi.fn()} />
        </VendorActiveStoreProvider>
      </MemoryRouter>,
    )
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled()
    await user.click(screen.getByRole('switch', { name: 'Desktop notifications for South' }))
    expect(FakeNotification.requestPermission).toHaveBeenCalled()
    expect(readOrderAlertChoice('south', 'north').desktop).toBe(true)
  })
})
