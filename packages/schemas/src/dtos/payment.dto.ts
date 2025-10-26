import { z } from 'zod'

// ========================================
// Payment DTOs
// ========================================

// Create Payment Intent Input
export const CreatePaymentIntentInputSchema = z.object({
  orderId: z.string().uuid().describe('Order ID to process payment for'),
  paymentMethodId: z.string().optional().describe('Stripe payment method ID (optional for saved methods)'),
  savePaymentMethod: z.boolean().default(false).describe('Save payment method for future use'),
})

// Payment Intent Response
export const PaymentIntentResponseSchema = z.object({
  clientSecret: z.string().describe('Stripe client secret for frontend'),
  paymentIntentId: z.string().describe('Stripe payment intent ID'),
  amount: z.number().describe('Amount in cents'),
  status: z.enum(['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled']),
})

// Stripe Connect Account Creation
export const CreateConnectAccountInputSchema = z.object({
  storeId: z.string().uuid().describe('Store ID to connect'),
  businessType: z.enum(['individual', 'company']).default('individual'),
  email: z.string().email().optional().describe('Business email'),
})

// Stripe Connect Onboarding Response
export const ConnectAccountResponseSchema = z.object({
  accountId: z.string().describe('Stripe Connect account ID'),
  onboardingUrl: z.string().url().describe('URL to complete Stripe onboarding'),
})

// Stripe Connect Account Status
export const ConnectAccountStatusSchema = z.object({
  accountId: z.string(),
  detailsSubmitted: z.boolean(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  requirements: z.object({
    currentlyDue: z.array(z.string()),
    eventuallyDue: z.array(z.string()),
    pastDue: z.array(z.string()),
  }).optional(),
})

// Webhook Event
export const StripeWebhookEventSchema = z.object({
  id: z.string().describe('Webhook event ID'),
  type: z.string().describe('Event type (e.g., payment_intent.succeeded)'),
  data: z.record(z.unknown()).describe('Event data payload'),
})

// Payment Method
export const PaymentMethodResponseSchema = z.object({
  id: z.string().uuid(),
  provider: z.enum(['TEST', 'STRIPE', 'SQUARE']),
  brand: z.string().nullable(),
  last4: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
})

export const PaymentMethodListResponseSchema = z.object({
  data: z.array(PaymentMethodResponseSchema),
  total: z.number(),
})

// Type exports
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInputSchema>
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>
export type CreateConnectAccountInput = z.infer<typeof CreateConnectAccountInputSchema>
export type ConnectAccountResponse = z.infer<typeof ConnectAccountResponseSchema>
export type ConnectAccountStatus = z.infer<typeof ConnectAccountStatusSchema>
export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>
export type PaymentMethodListResponse = z.infer<typeof PaymentMethodListResponseSchema>

