/** The shared realtime client keeps retrying while the API restarts, instead of giving up after one try. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRealtimeClient } from '@packages/realtime'

class FakeSocket {
  static readonly OPEN = 1
  static all: FakeSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onclose: ((e: { code: number; reason: string }) => void) | null = null
  readyState = 0
  sent: string[] = []
  constructor(public url: string) {
    FakeSocket.all.push(this)
  }
  send(data: string) {
    this.sent.push(data)
  }
  close() {}
  /** Server accepts: open, then acknowledge the hello. */
  accept() {
    this.readyState = 1
    this.onopen?.()
    this.onmessage?.({ data: JSON.stringify({ type: 'ack', version: 1, pingInterval: 60_000, clientId: 'c' }) })
  }
  drop(code = 1006) {
    this.readyState = 3
    this.onclose?.({ code, reason: '' })
  }
}

describe('realtime client reconnect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeSocket.all = []
    vi.stubGlobal('WebSocket', FakeSocket)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const client = () =>
    createRealtimeClient({ url: 'ws://api/realtime', getAuth: () => 'token', reconnect: { maxAttempts: 10, initialDelay: 1000, maxDelay: 30_000 } })

  it('keeps retrying while the server is down, then resubscribes', async () => {
    const c = client()
    c.subscribe('order:1', () => {})
    await c.connect()
    FakeSocket.all[0]!.accept()
    expect(c.isConnected()).toBe(true)

    FakeSocket.all[0]!.drop() // API restarts
    for (let attempt = 1; attempt <= 3; attempt++) {
      await vi.advanceTimersByTimeAsync(30_000)
      expect(FakeSocket.all).toHaveLength(attempt + 1)
      FakeSocket.all[attempt]!.drop() // still down
    }

    await vi.advanceTimersByTimeAsync(30_000)
    const back = FakeSocket.all.at(-1)!
    back.accept()
    expect(c.isConnected()).toBe(true)
    expect(back.sent.some((m) => m.includes('"subscribe"') && m.includes('order:1'))).toBe(true)
  })

  it('does not retry when the server rejects the token', async () => {
    const c = client()
    await c.connect()
    FakeSocket.all[0]!.accept()
    FakeSocket.all[0]!.drop(4401)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(FakeSocket.all).toHaveLength(1)
  })
})
