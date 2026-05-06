import { describe, expect, it, vi } from 'vitest'

const mockTx = {
  payout: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payoutOrder: {
    deleteMany: vi.fn(),
  },
}

vi.mock('../client', () => {
  return {
    prisma: {
      $transaction: async (fn: (tx: typeof mockTx) => unknown) => fn(mockTx),
    },
  }
})

describe('updateVendorPayoutStatus', () => {
  it('prevents edits to completed payouts', async () => {
    const { updateVendorPayoutStatus } = await import('./vendor-payout.service.js')

    mockTx.payout.findUnique.mockResolvedValueOnce({ id: 'p1', status: 'COMPLETED' })

    await expect(updateVendorPayoutStatus({ payoutId: 'p1', status: 'FAILED' })).rejects.toThrow(/immutable/i)
  })

  it('releases orders when marking payout FAILED', async () => {
    const { updateVendorPayoutStatus } = await import('./vendor-payout.service.js')

    mockTx.payout.findUnique.mockResolvedValueOnce({ id: 'p1', status: 'PENDING' })
    mockTx.payoutOrder.deleteMany.mockResolvedValueOnce({ count: 2 })
    mockTx.payout.update.mockResolvedValueOnce({ id: 'p1', status: 'FAILED' })

    const out = await updateVendorPayoutStatus({ payoutId: 'p1', status: 'FAILED', failureReason: 'test' })

    expect(mockTx.payoutOrder.deleteMany).toHaveBeenCalledWith({ where: { payoutId: 'p1' } })
    expect(mockTx.payout.update).toHaveBeenCalled()
    expect(out).toEqual({ id: 'p1', status: 'FAILED' })
  })
})

