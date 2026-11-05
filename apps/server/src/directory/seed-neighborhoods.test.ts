import { randomUUID } from 'crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { ensureGazetteer, prisma } from '@packages/db'
import { seedAustinNeighborhoods } from './seed-neighborhoods.js'

describe('neighborhood drafts', () => {
  const slug = 'austin-tx-coverage-preserve'
  const id = randomUUID()

  afterAll(async () => {
    await prisma.placePostalCode.deleteMany({ where: { placeId: id } })
    await prisma.place.deleteMany({ where: { id } })
  })

  it('leaves an existing profile unpublished flag and text alone', async () => {
    await ensureGazetteer(prisma)
    const austin = await prisma.place.findUniqueOrThrow({ where: { slug: 'austin-tx' }, select: { id: true } })
    await prisma.place.deleteMany({ where: { slug } })
    await prisma.place.create({
      data: {
        id,
        kind: 'NEIGHBORHOOD',
        name: 'Coverage Preserve',
        slug,
        parentId: austin.id,
        state: 'TX',
        country: 'US',
        latitude: '30.25000000',
        longitude: '-97.75000000',
        headline: 'Keep this',
        about: 'Written by an admin',
        published: true,
      },
    })
    const result = await seedAustinNeighborhoods([{ name: 'Coverage Preserve', latitude: 30.1, longitude: -97.7, zip: '78704' }])
    const saved = await prisma.place.findUniqueOrThrow({ where: { id } })
    expect(result.preserved).toBe(1)
    expect(saved.published).toBe(true)
    expect(saved.headline).toBe('Keep this')
    expect(saved.about).toBe('Written by an admin')
    expect(Number(saved.latitude)).toBeCloseTo(30.25)
  })
})
