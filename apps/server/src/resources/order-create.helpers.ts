import type { ExtendedPrismaClient } from '@packages/db'
import { haversineMiles } from '@packages/db'
import { Prisma } from '@packages/db/generated/client'
import type { CoordPair } from '../utils/order-coords.js'
import { parseCoordPair, parseGeoJson } from '../utils/order-coords.js'

const ADDRESS_FOR_ORDER_SELECT = {
  id: true,
  userId: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  geo: true,
} as const

export type VerifiedAddressForOrder = Prisma.AddressGetPayload<{
  select: typeof ADDRESS_FOR_ORDER_SELECT
}>

export type OrderBeforeCreateInput = Readonly<{
  cartId: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
  deliveryLatitude?: number | string
  deliveryLongitude?: number | string
}>

export function asOrderBeforeCreateInput(data: unknown): OrderBeforeCreateInput {
  return data as OrderBeforeCreateInput
}

export async function loadVerifiedAddressForOrder(
  db: Pick<ExtendedPrismaClient, 'address'>,
  addressId: string | undefined,
  requestingUserId: string,
) {
  if (!addressId) {
    return null
  }
  const address = await db.address.findUnique({
    where: { id: addressId },
    select: ADDRESS_FOR_ORDER_SELECT,
  })
  if (!address || address.userId !== requestingUserId) {
    throw new Error('Forbidden')
  }
  return address
}

export function resolveOrderDeliveryCoords(
  input: Readonly<Pick<OrderBeforeCreateInput, 'deliveryLatitude' | 'deliveryLongitude'>>,
  address: Pick<VerifiedAddressForOrder, 'geo'> | null,
): CoordPair | undefined {
  const fromPayload = parseCoordPair(input.deliveryLatitude, input.deliveryLongitude)
  if (fromPayload) {
    return fromPayload
  }
  if (address) {
    return parseGeoJson(address.geo) ?? undefined
  }
  return undefined
}

export function buildOrderAddressSnapshot(
  address: VerifiedAddressForOrder | null,
  deliveryType: 'DELIVERY' | 'PICKUP',
  pin: CoordPair | undefined,
): Record<string, unknown> | null {
  const pinGeo =
    pin !== undefined ? { latitude: pin.lat, longitude: pin.lng } : undefined

  if (address) {
    return {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      ...(pinGeo ? { geo: pinGeo } : {}),
    }
  }

  if (deliveryType === 'DELIVERY' && pinGeo) {
    return {
      line1: 'Delivery location',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      geo: pinGeo,
    }
  }

  return null
}

export function persistDeliveryPair(
  deliveryType: 'DELIVERY' | 'PICKUP',
  resolved: CoordPair | undefined,
): CoordPair | null {
  if (deliveryType !== 'DELIVERY' || resolved === undefined) {
    return null
  }
  return resolved
}

export function computeOrderCreateDeliveryDistance(
  totals: Readonly<{
    storeId: string
    storeLatitude: number | null
    storeLongitude: number | null
  }>,
  delivery: CoordPair | null,
): Readonly<{
  deliveryDistanceMiles: InstanceType<typeof Prisma.Decimal> | null
  warnMissingStoreCoords: boolean
}> {
  if (!delivery) {
    return { deliveryDistanceMiles: null, warnMissingStoreCoords: false }
  }

  if (totals.storeLatitude != null && totals.storeLongitude != null) {
    const miles = haversineMiles(
      { latitude: totals.storeLatitude, longitude: totals.storeLongitude },
      { latitude: delivery.lat, longitude: delivery.lng },
    )
    return {
      deliveryDistanceMiles: new Prisma.Decimal(miles.toFixed(2)),
      warnMissingStoreCoords: false,
    }
  }

  return { deliveryDistanceMiles: null, warnMissingStoreCoords: true }
}
