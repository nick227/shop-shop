import { randomUUID } from 'crypto'
import { prisma } from '@packages/db'

export type NeighborhoodDraft = {
  readonly name: string
  readonly latitude: number
  readonly longitude: number
  readonly zip: string | null
}

function slugFor(name: string): string {
  return `austin-tx-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 120)
}

export async function seedAustinNeighborhoods(areas: readonly NeighborhoodDraft[]) {
  const austin = await prisma.place.findUnique({ where: { slug: 'austin-tx' } })
  if (!austin) throw new Error('Austin is not in the place directory')
  const knownZips = new Set((await prisma.postalCode.findMany({ select: { code: true } })).map((row) => row.code))
  let created = 0
  let preserved = 0
  for (const area of areas) {
    const slug = slugFor(area.name)
    const existing = await prisma.place.findUnique({ where: { slug }, select: { id: true } })
    const place = existing ?? await prisma.place.create({
      data: {
        id: randomUUID(),
        kind: 'NEIGHBORHOOD',
        name: area.name,
        slug,
        parentId: austin.id,
        state: 'TX',
        country: 'US',
        latitude: area.latitude.toFixed(8),
        longitude: area.longitude.toFixed(8),
        published: false,
      },
      select: { id: true },
    })
    if (existing) preserved += 1
    else created += 1
    if (!area.zip || !knownZips.has(area.zip)) continue
    await prisma.placePostalCode.upsert({
      where: { placeId_postalCode: { placeId: place.id, postalCode: area.zip } },
      create: { placeId: place.id, postalCode: area.zip },
      update: {},
    })
  }
  return { created, preserved }
}
