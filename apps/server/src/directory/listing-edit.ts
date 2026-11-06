import { prisma } from '@packages/db'

function filled(value: string | null): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

export type ListingEdit = {
  readonly name: string
  readonly category: string
  readonly categoryLabel: string
  readonly phone: string
  readonly website: string
  readonly description: string
  readonly addressStreet: string
  readonly addressCity: string
  readonly addressState: string
  readonly addressZip: string
  readonly published: boolean
  readonly featured: boolean
  readonly placeId: string | null
  readonly neighborhoodIds: readonly string[]
  readonly featuredNeighborhoodIds: readonly string[]
  readonly imageUrls: readonly string[]
  readonly videoUrls: readonly string[]
  readonly storeId: string | null
}

type ListingFailure = { error: string; status: 400 | 404 | 409 }

export async function updateListing(id: string, input: ListingEdit): Promise<{ id: string } | ListingFailure> {
  const current = await prisma.businessListing.findUnique({ where: { id }, select: { id: true, storeId: true } })
  if (!current) return { error: 'Listing not found', status: 404 }
  if (input.storeId && input.storeId !== current.storeId) {
    const store = await prisma.store.findUnique({ where: { id: input.storeId }, select: { id: true } })
    if (!store) return { error: 'Merchant not found', status: 404 }
    const taken = await prisma.businessListing.findUnique({ where: { storeId: input.storeId }, select: { id: true } })
    if (taken && taken.id !== id) return { error: 'That merchant is already linked to a listing', status: 409 }
  }
  const neighborhoods = input.neighborhoodIds.length === 0 ? [] : await prisma.place.findMany({
    where: { id: { in: [...input.neighborhoodIds] }, kind: 'NEIGHBORHOOD' },
    select: { id: true },
  })
  if (neighborhoods.length !== input.neighborhoodIds.length) return { error: 'Choose neighborhoods that already exist', status: 400 }
  await prisma.$transaction(async (tx) => {
    await tx.businessListing.update({
      where: { id },
      data: {
        name: input.name,
        category: input.category,
        categoryLabel: input.categoryLabel,
        phone: filled(input.phone),
        website: filled(input.website),
        description: filled(input.description),
        addressStreet: filled(input.addressStreet),
        addressCity: filled(input.addressCity),
        addressState: filled(input.addressState),
        addressZip: filled(input.addressZip),
        published: input.published,
        featured: input.featured,
        placeId: input.placeId,
        storeId: input.storeId,
      },
    })
    await tx.listingNeighborhood.deleteMany({ where: { listingId: id } })
    if (neighborhoods.length > 0) {
      await tx.listingNeighborhood.createMany({
        data: neighborhoods.map((place) => ({
          listingId: id,
          placeId: place.id,
          featured: input.featuredNeighborhoodIds.includes(place.id),
        })),
      })
    }
    await tx.mediaAsset.deleteMany({ where: { listingId: id } })
    const media = [
      ...input.imageUrls.map((url, sortIndex) => ({ listingId: id, kind: 'IMAGE' as const, url, sortIndex })),
      ...input.videoUrls.map((url, sortIndex) => ({ listingId: id, kind: 'VIDEO' as const, url, sortIndex })),
    ]
    if (media.length > 0) await tx.mediaAsset.createMany({ data: media })
  })
  return { id }
}

export async function mergeListings(keepId: string, dropId: string): Promise<{ id: string } | ListingFailure> {
  if (keepId === dropId) return { error: 'Choose two different listings', status: 400 }
  const [keep, drop] = await Promise.all([
    prisma.businessListing.findUnique({ where: { id: keepId } }),
    prisma.businessListing.findUnique({ where: { id: dropId } }),
  ])
  if (!keep || !drop) return { error: 'Listing not found', status: 404 }
  if (keep.storeId && drop.storeId && keep.storeId !== drop.storeId) return { error: 'These listings belong to different merchants', status: 409 }
  const prefer = (current: string | null, incoming: string | null) => filled(current) ?? filled(incoming)
  await prisma.$transaction(async (tx) => {
    if (!keep.storeId && drop.storeId) await tx.businessListing.update({ where: { id: dropId }, data: { storeId: null } })
    await tx.businessListing.update({
      where: { id: keepId },
      data: {
        phone: prefer(keep.phone, drop.phone),
        website: prefer(keep.website, drop.website),
        description: prefer(keep.description, drop.description),
        addressStreet: prefer(keep.addressStreet, drop.addressStreet),
        addressCity: prefer(keep.addressCity, drop.addressCity),
        addressState: prefer(keep.addressState, drop.addressState),
        addressZip: prefer(keep.addressZip, drop.addressZip),
        storeId: keep.storeId ?? drop.storeId,
        featured: keep.featured || drop.featured,
      },
    })
    await tx.mediaAsset.updateMany({ where: { listingId: dropId }, data: { listingId: keepId } })
    await tx.businessImportEntry.updateMany({ where: { listingId: dropId }, data: { listingId: keepId } })
    const links = await tx.listingNeighborhood.findMany({ where: { listingId: dropId } })
    for (const link of links) {
      await tx.listingNeighborhood.upsert({
        where: { listingId_placeId: { listingId: keepId, placeId: link.placeId } },
        create: { listingId: keepId, placeId: link.placeId, featured: link.featured },
        update: {},
      })
    }
    await tx.businessListing.delete({ where: { id: dropId } })
  })
  return { id: keepId }
}
