/**
 * Stripe Payment Element — creates a PaymentMethod id for server-side PaymentIntent confirmation.
 */
import { type ForwardedRef, forwardRef, useImperativeHandle } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

export type StripePaymentFieldsHandle = {
  readonly confirmPayment: () => Promise<{ readonly paymentMethodId?: string; readonly errorMessage?: string }>
  /** Finishes a bank's 3-D Secure check; resolves to an error message, or undefined when paid. */
  readonly finishPayment: (clientSecret: string) => Promise<string | undefined>
}

export const StripePaymentFields = forwardRef(function StripePaymentFields(
  _props: unknown,
  ref: ForwardedRef<StripePaymentFieldsHandle>,
) {
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

      async finishPayment(clientSecret: string) {
        if (!stripe) return 'Payment form is still loading. Try again in a moment.'
        const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret })
        if (error) return error.message ?? 'Your bank didn’t confirm the payment. Try again or use another card.'
        if (paymentIntent?.status === 'requires_payment_method') return 'Your bank declined the payment. Try another card.'
        return undefined
      },
    }))

    return (
      <div className="rounded-lg border border-border bg-background p-3">
        <PaymentElement />
      </div>
    )
})
