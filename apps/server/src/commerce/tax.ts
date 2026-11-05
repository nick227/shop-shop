/**
 * Sales tax for checkout.
 *
 * - `stripe`: Stripe Tax calculations, using each line's tax category (mapped to a Stripe product tax
 *   code), the store as the ship-from location, and the delivery address (or the store, for pickup) as
 *   the destination. Authoritative.
 * - `estimate`: a labeled development estimate from a small rate table. Never authoritative.
 *
 * Which one runs is explicit: TAX_PROVIDER=stripe|estimate. It defaults to `stripe` in production and
 * `estimate` elsewhere. Production refuses `estimate` unless ALLOW_ESTIMATED_TAX=true, and a failed
 * Stripe calculation fails the quote; it never falls back to an estimate.
 */
import type { TaxCategory } from '@packages/db/generated/client'
import { getStripe } from '@packages/db'
import { AppError } from '../middleware/errors.js'

export type TaxProviderName = 'stripe' | 'estimate'

export interface TaxAddress {
  readonly line1?: string | null
  readonly line2?: string | null
  readonly city?: string | null
  readonly state?: string | null
  readonly postalCode?: string | null
  readonly country?: string | null
}

export interface TaxLine {
  readonly reference: string
  /** The line's total before tax, in cents (unit price × quantity). */
  readonly amountCents: number
  readonly quantity: number
  readonly category: TaxCategory
}

export interface TaxInput {
  readonly lines: readonly TaxLine[]
  readonly deliveryFeeCents: number
  /** Where the order is fulfilled: the delivery address, or the store itself for pickup. */
  readonly destination: TaxAddress
  readonly origin: TaxAddress
}

export interface TaxResult {
  readonly taxCents: number
  readonly provider: TaxProviderName
  /** True when the amount is an estimate and must be labeled as one. */
  readonly estimated: boolean
  readonly calculationId: string | null
}

/** Stripe product tax codes, from https://docs.stripe.com/tax/tax-codes. */
export const STRIPE_TAX_CODES: Record<TaxCategory, string> = {
  PREPARED_FOOD: 'txcd_40060003', // Food for Immediate Consumption
  GROCERY: 'txcd_40040000', // Food for Non-Immediate Consumption
  CANDY: 'txcd_40100001', // Candy
  SOFT_DRINK: 'txcd_41040002', // Carbonated Soft Drinks - 0% fruit or vegetable juice
  BOTTLED_WATER: 'txcd_41030001', // Bottled Water
  ALCOHOL: 'txcd_41020001', // Alcoholic Beverages - Beer/Malt Beverage
  GENERAL: 'txcd_99999999', // General - Tangible Goods
}

const GROCERY_STORE_TYPES = new Set(['CONVENIENCE', 'GROCERY', 'RETAIL', 'SPECIALTY', 'GENERAL'])

/** An item's category, else its store's default, else one implied by the kind of store. */
export function resolveTaxCategory(
  itemCategory: TaxCategory | null | undefined,
  storeDefault: TaxCategory | null | undefined,
  storeType: string | null | undefined,
): TaxCategory {
  if (itemCategory) return itemCategory
  if (storeDefault) return storeDefault
  return storeType && GROCERY_STORE_TYPES.has(storeType) ? 'GROCERY' : 'PREPARED_FOOD'
}

// ---------------------------------------------------------------------------
// Development estimate
// ---------------------------------------------------------------------------

/** Rates for the estimate only. Texas: 6.25% state + 2% local; unprepared food and water exempt. */
const ESTIMATE_RULES: Record<string, { rate: number; exempt: readonly TaxCategory[] }> = {
  TX: { rate: 0.0825, exempt: ['GROCERY', 'BOTTLED_WATER'] },
}
const ESTIMATE_DEFAULT = { rate: 0.0825, exempt: ['GROCERY'] as readonly TaxCategory[] }

export function estimateTax(input: TaxInput): TaxResult {
  const state = (input.destination.state ?? input.origin.state ?? '').toUpperCase()
  const rules = ESTIMATE_RULES[state] ?? ESTIMATE_DEFAULT
  const taxableCents = input.lines
    .filter((line) => !rules.exempt.includes(line.category))
    .reduce((sum, line) => sum + line.amountCents, 0)
  const allCents = input.lines.reduce((sum, line) => sum + line.amountCents, 0)
  // A delivery charge is taxed in the share that the taxable goods make up.
  const deliveryTaxableCents = allCents > 0 ? input.deliveryFeeCents * (taxableCents / allCents) : 0
  return {
    taxCents: Math.round((taxableCents + deliveryTaxableCents) * rules.rate),
    provider: 'estimate',
    estimated: true,
    calculationId: null,
  }
}

// ---------------------------------------------------------------------------
// Stripe Tax
// ---------------------------------------------------------------------------

type StripeLike = {
  tax: { calculations: { create: (params: Record<string, unknown>) => Promise<{ id?: string | null; tax_amount_exclusive: number }> } }
}

const stripeAddress = (address: TaxAddress) => ({
  line1: address.line1 ?? undefined,
  line2: address.line2 ?? undefined,
  city: address.city ?? undefined,
  state: address.state ?? undefined,
  postal_code: address.postalCode ?? undefined,
  country: address.country ?? 'US',
})

export async function stripeTax(input: TaxInput, client: StripeLike = getStripe() as unknown as StripeLike): Promise<TaxResult> {
  try {
    const calculation = await client.tax.calculations.create({
      currency: 'usd',
      line_items: input.lines.map((line) => ({
        amount: line.amountCents,
        quantity: line.quantity,
        reference: line.reference,
        tax_code: STRIPE_TAX_CODES[line.category],
        tax_behavior: 'exclusive',
      })),
      customer_details: { address: stripeAddress(input.destination), address_source: 'shipping' },
      ship_from_details: { address: stripeAddress(input.origin) },
      ...(input.deliveryFeeCents > 0 ? { shipping_cost: { amount: input.deliveryFeeCents } } : {}),
    })
    return { taxCents: calculation.tax_amount_exclusive, provider: 'stripe', estimated: false, calculationId: calculation.id ?? null }
  } catch (error) {
    console.error(JSON.stringify({ event: 'tax.stripe_failed', message: error instanceof Error ? error.message : String(error) }))
    // Never substitute an estimate for an authoritative calculation.
    throw new AppError(503, 'Sales tax could not be calculated right now. Please try again in a moment.')
  }
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export function configuredTaxProvider(env: NodeJS.ProcessEnv = process.env): TaxProviderName {
  const production = env.NODE_ENV === 'production'
  const chosen = (env.TAX_PROVIDER ?? (production ? 'stripe' : 'estimate')).toLowerCase()
  if (chosen !== 'stripe' && chosen !== 'estimate') throw new Error(`TAX_PROVIDER must be "stripe" or "estimate" (got "${chosen}")`)
  if (chosen === 'estimate' && production && env.ALLOW_ESTIMATED_TAX !== 'true') {
    throw new Error('Estimated tax is not allowed in production. Set TAX_PROVIDER=stripe, or ALLOW_ESTIMATED_TAX=true knowingly.')
  }
  return chosen
}

export async function calculateTax(input: TaxInput): Promise<TaxResult> {
  if (input.lines.length === 0) return { taxCents: 0, provider: configuredTaxProvider(), estimated: false, calculationId: null }
  return configuredTaxProvider() === 'stripe' ? stripeTax(input) : estimateTax(input)
}
