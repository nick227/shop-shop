/**
 * Stripe Payment Element — creates a PaymentMethod id for server-side PaymentIntent confirmation.
 */
import { forwardRef, useImperativeHandle } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

export type StripePaymentFieldsHandle = {
  readonly confirmPayment: () => Promise<{ readonly paymentMethodId?: string; readonly errorMessage?: string }>
}

export const StripePaymentFields = forwardRef<StripePaymentFieldsHandle, Record<never, never>>(
  function StripePaymentFields(_props, ref) {
    const stripe = useStripe()
    const elements = useElements()

    useImperativeHandle(ref, () => ({
      async confirmPayment() {
        if (!stripe || !elements) {
          return { errorMessage: 'Payment form is still loading. Try again in a moment.' }
        }

        const { error: submitError } = await elements.submit()
        if (submitError) {
          return { errorMessage: submitError.message ?? 'Check your card details and try again.' }
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({ elements })

        if (error) {
          return { errorMessage: error.message ?? 'Could not save payment method.' }
        }

        if (!paymentMethod) {
          return { errorMessage: 'No payment method returned.' }
        }

        return { paymentMethodId: paymentMethod.id }
      },
    }))

    return (
      <div className="rounded-lg border border-border bg-background p-3">
        <PaymentElement />
      </div>
    )
  },
)
