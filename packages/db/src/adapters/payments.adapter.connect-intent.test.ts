/**
 * PaymentIntent create params for Connect: transfer_data.destination and optional application_fee_amount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Decimal } from 'decimal.js'

const paymentIntentsCreate = vi.fn(
  async (_params: Record<string, unknown>, _opts?: { idempotencyKey?: string }) => ({
    id: 'pi_test_connect',
    client_secret: 'pi_test_connect_secret',
    status: 'requires_capture',
    amount: (_params as { amount: number }).amount,
  }),
)

vi.mock('stripe', () => ({
  default: class StripeMock {
    paymentIntents = {
      create: paymentIntentsCreate,
    }
  },
}))

import { createPaymentIntent } from './payments.adapter.js'

describe('createPaymentIntent (Connect)', () => {
  beforeEach(() => {
    paymentIntentsCreate.mockClear()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock_for_adapter_unit_tests')
  })

  it('sets transfer_data.destination to the connected account id', async () => {
    await createPaymentIntent({
      amount: new Decimal('12.34'),
      orderId: 'order-uuid-1',
      paymentMethodId: 'pm_card_visa',
      connectedAccountId: 'acct_1SOFTWARETEST',
      applicationFeeAmount: new Decimal('0'),
      idempotencyKey: 'paymentintent-order-order-uuid-1',
    })

    expect(paymentIntentsCreate).toHaveBeenCalledTimes(1)
    const [params] = paymentIntentsCreate.mock.calls[0]!
    expect(params.transfer_data).toEqual({ destination: 'acct_1SOFTWARETEST' })
    expect(params.application_fee_amount).toBeUndefined()
  })

  it('sets application_fee_amount in cents when service fee is positive', async () => {
    await createPaymentIntent({
      amount: new Decimal('50.00'),
      orderId: 'order-uuid-2',
      paymentMethodId: 'pm_card_visa',
      connectedAccountId: 'acct_1ABCDE',
      applicationFeeAmount: new Decimal('2.50'),
      idempotencyKey: 'paymentintent-order-order-uuid-2',
    })

    const [params] = paymentIntentsCreate.mock.calls[0]!
    expect(params.transfer_data).toEqual({ destination: 'acct_1ABCDE' })
    expect(params.application_fee_amount).toBe(250)
  })

  it('omits application_fee_amount when fee is zero', async () => {
    await createPaymentIntent({
      amount: new Decimal('10.00'),
      orderId: 'order-uuid-3',
      paymentMethodId: 'pm_card_visa',
      connectedAccountId: 'acct_1ZEROFEE',
      applicationFeeAmount: new Decimal('0'),
    })

    const [params] = paymentIntentsCreate.mock.calls[0]!
    expect(params.transfer_data).toEqual({ destination: 'acct_1ZEROFEE' })
    expect(params.application_fee_amount).toBeUndefined()
  })
})
