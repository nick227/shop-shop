/**
 * Order Lifecycle Integration Test
 * Simulates the full state machine: PLACED → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
 * Also verifies invalid transitions are rejected and CANCELED path works from any non-terminal state.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { prisma, orderService } from '@packages/db'
import { canTransitionTo, assertValidTransition, ORDER_TRANSITIONS } from '@packages/db'
import {
  createAuthenticatedUser,
  createTestStore,
  createTestOrder,
  cleanupTestUsers,
} from './helpers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function transitionOrder(orderId: string, newStatus: string, note?: string) {
  return orderService.transitionOrderStatus({
    orderId,
    newStatus: newStatus as Parameters<typeof orderService.transitionOrderStatus>[0]['newStatus'],
    note,
    changedBy: 'test-runner',
  })
}

async function getStatus(orderId: string): Promise<string> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
  return order.status
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Order State Machine', () => {
  let userId: string
  let storeId: string

  beforeAll(async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const user = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    userId = user.id
    storeId = store.id
  })

  afterAll(async () => {
    await cleanupTestUsers()
  })

  // -------------------------------------------------------------------------
  // State machine structure
  // -------------------------------------------------------------------------

  describe('ORDER_TRANSITIONS map', () => {
    it('covers all expected statuses', () => {
      const expected = [
        'PLACED', 'ACCEPTED', 'PREPARING', 'READY',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED', 'COMPLETED',
      ]
      for (const s of expected) {
        expect(ORDER_TRANSITIONS).toHaveProperty(s)
      }
    })

    it('DELIVERED is terminal', () => {
      expect(ORDER_TRANSITIONS.DELIVERED).toHaveLength(0)
    })

    it('CANCELED is terminal', () => {
      expect(ORDER_TRANSITIONS.CANCELED).toHaveLength(0)
    })

    it('COMPLETED is legacy terminal', () => {
      expect(ORDER_TRANSITIONS.COMPLETED).toHaveLength(0)
    })

    it('each step in the happy path is valid', () => {
      const happyPath: [string, string][] = [
        ['PLACED',           'ACCEPTED'],
        ['ACCEPTED',         'PREPARING'],
        ['PREPARING',        'READY'],
        ['READY',            'OUT_FOR_DELIVERY'],
        ['OUT_FOR_DELIVERY', 'DELIVERED'],
      ]
      for (const [from, to] of happyPath) {
        expect(canTransitionTo(from, to).valid).toBe(true)
      }
    })
  })

  // -------------------------------------------------------------------------
  // assertValidTransition
  // -------------------------------------------------------------------------

  describe('assertValidTransition', () => {
    it('does not throw for valid transitions', () => {
      expect(() => assertValidTransition('PLACED', 'ACCEPTED')).not.toThrow()
      expect(() => assertValidTransition('READY', 'OUT_FOR_DELIVERY')).not.toThrow()
      expect(() => assertValidTransition('OUT_FOR_DELIVERY', 'DELIVERED')).not.toThrow()
    })

    it('throws InvalidOrderTransitionError for skipped steps', () => {
      expect(() => assertValidTransition('PLACED', 'PREPARING')).toThrow('InvalidOrderTransitionError' in Error ? expect.anything() : expect.objectContaining({ name: 'InvalidOrderTransitionError' }))
    })

    it('throws when trying to leave a terminal state', () => {
      expect(() => assertValidTransition('DELIVERED', 'PLACED')).toThrow()
      expect(() => assertValidTransition('CANCELED', 'ACCEPTED')).toThrow()
      expect(() => assertValidTransition('COMPLETED', 'READY')).toThrow()
    })

    it('throws for backwards transitions', () => {
      expect(() => assertValidTransition('PREPARING', 'ACCEPTED')).toThrow()
      expect(() => assertValidTransition('DELIVERED', 'OUT_FOR_DELIVERY')).toThrow()
    })

    it('throws for same-state transition', () => {
      expect(() => assertValidTransition('PLACED', 'PLACED')).toThrow()
    })

    it('error name is InvalidOrderTransitionError', () => {
      let caught: Error | null = null
      try {
        assertValidTransition('DELIVERED', 'PLACED')
      } catch (err) {
        caught = err as Error
      }
      expect(caught).not.toBeNull()
      expect(caught!.name).toBe('InvalidOrderTransitionError')
    })
  })

  // -------------------------------------------------------------------------
  // Full happy-path lifecycle via orderService.transitionOrderStatus()
  // -------------------------------------------------------------------------

  describe('Full lifecycle: PLACED → DELIVERED', () => {
    let orderId: string

    beforeEach(async () => {
      const order = await createTestOrder(userId, storeId, { status: 'PLACED' })
      orderId = order.id
    })

    afterEach(async () => {
      await prisma.orderEvent.deleteMany({ where: { orderId } })
      await prisma.order.deleteMany({ where: { id: orderId } })
    })

    it('steps through the full happy path', async () => {
      expect(await getStatus(orderId)).toBe('PLACED')

      await transitionOrder(orderId, 'ACCEPTED', 'Vendor accepted order')
      expect(await getStatus(orderId)).toBe('ACCEPTED')

      await transitionOrder(orderId, 'PREPARING', 'Kitchen started')
      expect(await getStatus(orderId)).toBe('PREPARING')

      await transitionOrder(orderId, 'READY', 'Order is ready')
      expect(await getStatus(orderId)).toBe('READY')

      await transitionOrder(orderId, 'OUT_FOR_DELIVERY', 'Rider picked up')
      expect(await getStatus(orderId)).toBe('OUT_FOR_DELIVERY')

      await transitionOrder(orderId, 'DELIVERED', 'Customer received order')
      expect(await getStatus(orderId)).toBe('DELIVERED')
    })

    it('creates an OrderEvent audit entry for each transition', async () => {
      await transitionOrder(orderId, 'ACCEPTED')
      await transitionOrder(orderId, 'PREPARING')

      const events = await prisma.orderEvent.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
      })

      // broadcastNewOrder creates the initial PLACED event; transitions add more
      const statuses = events.map((e) => e.status)
      expect(statuses).toContain('ACCEPTED')
      expect(statuses).toContain('PREPARING')
    })
  })

  // -------------------------------------------------------------------------
  // Cancellation from every cancellable state
  // -------------------------------------------------------------------------

  describe('CANCELED transition', () => {
    const cancellableStates = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] as const

    for (const fromStatus of cancellableStates) {
      it(`can cancel from ${fromStatus}`, async () => {
        const order = await createTestOrder(userId, storeId, { status: fromStatus })
        await transitionOrder(order.id, 'CANCELED', 'Test cancellation')
        expect(await getStatus(order.id)).toBe('CANCELED')
        await prisma.orderEvent.deleteMany({ where: { orderId: order.id } })
        await prisma.order.delete({ where: { id: order.id } })
      })
    }

    it('cannot cancel OUT_FOR_DELIVERY order', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'OUT_FOR_DELIVERY' })
      await expect(transitionOrder(order.id, 'CANCELED')).rejects.toThrow()
      await prisma.order.delete({ where: { id: order.id } })
    })

    it('cannot cancel a DELIVERED order', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'DELIVERED' })
      await expect(transitionOrder(order.id, 'CANCELED')).rejects.toThrow()
      await prisma.order.delete({ where: { id: order.id } })
    })

    it('cannot cancel an already-CANCELED order', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'CANCELED' })
      await expect(transitionOrder(order.id, 'CANCELED')).rejects.toThrow()
      await prisma.order.delete({ where: { id: order.id } })
    })
  })

  // -------------------------------------------------------------------------
  // Invalid / skip transitions rejected
  // -------------------------------------------------------------------------

  describe('Invalid transitions are rejected', () => {
    it('cannot skip from PLACED directly to PREPARING', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'PLACED' })
      await expect(transitionOrder(order.id, 'PREPARING')).rejects.toThrow()
      expect(await getStatus(order.id)).toBe('PLACED') // unchanged
      await prisma.order.delete({ where: { id: order.id } })
    })

    it('cannot move backwards from PREPARING to ACCEPTED', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'PREPARING' })
      await expect(transitionOrder(order.id, 'ACCEPTED')).rejects.toThrow()
      expect(await getStatus(order.id)).toBe('PREPARING')
      await prisma.order.delete({ where: { id: order.id } })
    })

    it('cannot transition a DELIVERED order to any state', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'DELIVERED' })
      for (const next of ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'CANCELED']) {
        await expect(transitionOrder(order.id, next)).rejects.toThrow()
      }
      await prisma.order.delete({ where: { id: order.id } })
    })

    it('cannot set an unknown status', async () => {
      const order = await createTestOrder(userId, storeId, { status: 'PLACED' })
      await expect(transitionOrder(order.id, 'BOGUS_STATUS')).rejects.toThrow()
      await prisma.order.delete({ where: { id: order.id } })
    })
  })
})
