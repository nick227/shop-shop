import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, persistStripeAccountSnapshotOnStore } from '@packages/db'

describe('persistStripeAccountSnapshotOnStore', () => {
  let storeId: string

  beforeEach(async () => {
    const u = await prisma.user.create({
      data: {
        email: `snap-${randomUUID()}@example.com`,
        passwordHash: 'x',
        name: 'Snap',
      },
    })
    const s = await prisma.store.create({
      data: {
        ownerUserId: u.id,
        name: 'Snap Store',
        slug: `snap-${randomUUID()}`,
        prepTimeMin: 15,
        stripeAccountId: `acct_${randomUUID().slice(0, 16)}`,
      },
    })
    storeId = s.id
  })

  it('writes charges/payouts/requirements from Stripe account payload', async () => {
    await persistStripeAccountSnapshotOnStore(
      storeId,
      {
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: false,
        requirements: {
          currently_due: ['individual.verification.document'],
          eventually_due: [],
          past_due: [],
          disabled_reason: null,
        },
      } as unknown as Parameters<typeof persistStripeAccountSnapshotOnStore>[1],
    )

    const row = await prisma.store.findUnique({ where: { id: storeId } })
    expect(row?.stripeChargesEnabled).toBe(true)
    expect(row?.stripePayoutsEnabled).toBe(false)
    expect(row?.stripeOnboarded).toBe(true)
    expect(row?.stripeLastSyncedAt).toBeTruthy()
  })
})
