import { prisma } from '../client.js'
import type { DeliveryZone } from '../generated/client'

export interface CreateDeliveryZoneInput {
  storeId: string
  name: string
  polygonJson: unknown // GeoJSON polygon
  baseFee: number
  minOrder?: number
  priority?: number
}

export interface UpdateDeliveryZoneInput {
  name?: string
  polygonJson?: unknown
  baseFee?: number
  minOrder?: number
  isActive?: boolean
  priority?: number
}

export interface PointCoordinates {
  lat: number
  lng: number
}

export async function createDeliveryZone(
  input: CreateDeliveryZoneInput
): Promise<DeliveryZone> {
  return prisma.deliveryZone.create({
    data: {
      storeId: input.storeId,
      name: input.name,
      polygonJson: input.polygonJson as object,
      baseFee: input.baseFee,
      minOrder: input.minOrder,
      priority: input.priority || 0,
    },
  })
}

export async function getDeliveryZone(zoneId: string): Promise<DeliveryZone | null> {
  return prisma.deliveryZone.findUnique({
    where: { id: zoneId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function updateDeliveryZone(
  zoneId: string,
  input: UpdateDeliveryZoneInput
): Promise<DeliveryZone> {
  const data: Record<string, unknown> = {}
  if (input.name !== undefined) data.name = input.name
  if (input.baseFee !== undefined) data.baseFee = input.baseFee
  if (input.minOrder !== undefined) data.minOrder = input.minOrder
  if (input.isActive !== undefined) data.isActive = input.isActive
  if (input.priority !== undefined) data.priority = input.priority
  if (input.polygonJson !== undefined) data.polygonJson = input.polygonJson as object
  
  return prisma.deliveryZone.update({
    where: { id: zoneId },
    data,
  })
}

export async function deleteDeliveryZone(zoneId: string): Promise<void> {
  await prisma.deliveryZone.delete({
    where: { id: zoneId },
  })
}

export async function getStoreDeliveryZones(storeId: string): Promise<DeliveryZone[]> {
  return prisma.deliveryZone.findMany({
    where: { storeId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function getActiveStoreDeliveryZones(storeId: string): Promise<DeliveryZone[]> {
  return prisma.deliveryZone.findMany({
    where: {
      storeId,
      isActive: true,
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  })
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: PointCoordinates, polygon: number[][]): boolean {
  let inside = false
  const x = point.lng
  const y = point.lat

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

export async function findDeliveryZoneForAddress(
  storeId: string,
  coordinates: PointCoordinates
): Promise<DeliveryZone | null> {
  const zones = await getActiveStoreDeliveryZones(storeId)

  for (const zone of zones) {
    const polygonData = zone.polygonJson as { coordinates?: number[][][] }
    
    if (
      polygonData?.coordinates &&
      Array.isArray(polygonData.coordinates) &&
      polygonData.coordinates.length > 0
    ) {
      const polygonCoords = polygonData.coordinates[0]
      if (isPointInPolygon(coordinates, polygonCoords)) {
        return zone
      }
    }
  }

  return null
}

export async function calculateDeliveryFee(
  storeId: string,
  coordinates: PointCoordinates,
  orderSubtotal: number
): Promise<{
  zone: DeliveryZone | null
  fee: number
  canDeliver: boolean
  reason?: string
}> {
  const zone = await findDeliveryZoneForAddress(storeId, coordinates)

  if (!zone) {
    return {
      zone: null,
      fee: 0,
      canDeliver: false,
      reason: 'Address is outside delivery zones',
    }
  }

  const minOrder = zone.minOrder ? Number(zone.minOrder) : 0
  if (orderSubtotal < minOrder) {
    return {
      zone,
      fee: Number(zone.baseFee),
      canDeliver: false,
      reason: `Minimum order of $${minOrder.toFixed(2)} required for this zone`,
    }
  }

  return {
    zone,
    fee: Number(zone.baseFee),
    canDeliver: true,
  }
}

export async function bulkUpdateZonePriorities(
  updates: Array<{ zoneId: string; priority: number }>
): Promise<void> {
  await Promise.all(
    updates.map((update) =>
      prisma.deliveryZone.update({
        where: { id: update.zoneId },
        data: { priority: update.priority },
      })
    )
  )
}

