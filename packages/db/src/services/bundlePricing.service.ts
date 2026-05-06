import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../client.js'

export interface BundlePriceResult {
  resolvedPrice: Decimal
  itemSum: Decimal
  savings: Decimal
  pricingType: string
}

/**
 * Compute the resolved purchase price for a bundle.
 *
 * FIXED_PRICE      — vendor sets an explicit price
 * DISCOUNT_PERCENT — itemSum * (1 - discountPercent/100)
 * DISCOUNT_AMOUNT  — itemSum - discountAmount
 * BEST_DEAL        — whichever strategy yields the lowest price
 */
export async function computeBundlePrice(bundleId: string): Promise<BundlePriceResult> {
  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    include: {
      pricing: true,
      items: {
        include: { item: { select: { price: true, isActive: true, isSoldOut: true } } },
      },
    },
  })

  if (!bundle) throw new Error(`Bundle ${bundleId} not found`)

  const D = (v: string | number) => new Decimal(v.toString())

  const itemSum = bundle.items.reduce(
    (acc, bi) => acc.plus(D(bi.item.price.toString()).times(bi.quantity)),
    new Decimal(0),
  )

  if (!bundle.pricing) {
    return { resolvedPrice: itemSum, itemSum, savings: new Decimal(0), pricingType: 'NONE' }
  }

  const p = bundle.pricing
  const candidates: Decimal[] = []
  if (p.fixedPrice != null) candidates.push(D(p.fixedPrice.toString()))
  if (p.discountPercent != null)
    candidates.push(itemSum.times(D(1).minus(D(p.discountPercent.toString()).div(100))))
  if (p.discountAmount != null) candidates.push(itemSum.minus(D(p.discountAmount.toString())))

  let resolvedPrice: Decimal

  switch (p.pricingType) {
    case 'FIXED_PRICE':
      resolvedPrice = p.fixedPrice != null ? D(p.fixedPrice.toString()) : itemSum
      break
    case 'DISCOUNT_PERCENT':
      resolvedPrice =
        p.discountPercent != null
          ? itemSum.times(D(1).minus(D(p.discountPercent.toString()).div(100)))
          : itemSum
      break
    case 'DISCOUNT_AMOUNT':
      resolvedPrice = p.discountAmount != null ? itemSum.minus(D(p.discountAmount.toString())) : itemSum
      break
    case 'BEST_DEAL':
      resolvedPrice =
        candidates.length > 0
          ? candidates.reduce((min, c) => (c.lessThan(min) ? c : min), itemSum)
          : itemSum
      break
    default:
      resolvedPrice = itemSum
  }

  if (resolvedPrice.lessThan(0)) resolvedPrice = new Decimal(0)

  if (p.minSavings != null) {
    const maxAllowed = itemSum.minus(D(p.minSavings.toString()))
    if (resolvedPrice.greaterThan(maxAllowed)) {
      resolvedPrice = maxAllowed.lessThan(0) ? new Decimal(0) : maxAllowed
    }
  }

  const savings = itemSum.minus(resolvedPrice)

  return {
    resolvedPrice: resolvedPrice.toDecimalPlaces(2),
    itemSum: itemSum.toDecimalPlaces(2),
    savings: savings.toDecimalPlaces(2),
    pricingType: p.pricingType,
  }
}

/**
 * Snapshot bundle contents at purchase time.
 * Stored on OrderItem.bundleSnapshot so order history survives bundle edits.
 */
export async function snapshotBundle(bundleId: string): Promise<Record<string, unknown>> {
  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    include: {
      pricing: true,
      items: {
        include: { item: { select: { id: true, title: true, price: true } } },
      },
    },
  })

  if (!bundle) throw new Error(`Bundle ${bundleId} not found`)

  const { resolvedPrice, itemSum, savings } = await computeBundlePrice(bundleId)

  return {
    bundleId: bundle.id,
    bundleName: bundle.name,
    bundleDescription: bundle.description,
    resolvedPrice: resolvedPrice.toString(),
    itemSum: itemSum.toString(),
    savings: savings.toString(),
    pricingType: bundle.pricing?.pricingType ?? 'NONE',
    items: bundle.items.map((bi) => ({
      itemId: bi.item.id,
      title: bi.item.title,
      unitPrice: bi.item.price.toString(),
      quantity: bi.quantity,
    })),
    snapshotAt: new Date().toISOString(),
  }
}
