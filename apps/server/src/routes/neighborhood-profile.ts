import { randomUUID } from 'crypto'
import { z } from 'zod'
import { prisma } from '@packages/db'

const ProfileBody = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().length(36),
  postalCodes: z.array(z.string().regex(/^\d{5}$/)).min(1),
  headline: z.string().trim().max(160).nullable().optional(),
  about: z.string().trim().max(8000).nullable().optional(),
  imageUrls: z.array(z.string().trim().url()).max(8).optional(),
  videoUrls: z.array(z.string().trim().url()).max(4).optional(),
  published: z.boolean().optional(),
})

export type NeighborhoodInput = z.infer<typeof ProfileBody>

export function parseNeighborhoodBody(body: unknown) {
  return ProfileBody.safeParse(body)
}

export function neighborhoodSlug(citySlug: string, name: string): string {
  const part = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${citySlug}-${part}`.slice(0, 120)
}

type CityRow = {
  id: string
  name: string
  slug: string
  state: string | null
  country: string
}

type PostalRow = {
  code: string
  latitude: { toString(): string }
  longitude: { toString(): string }
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed : null
}

function centroid(rows: readonly PostalRow[]) {
  const latitude = rows.reduce((sum, row) => sum + Number(row.latitude), 0) / rows.length
  const longitude = rows.reduce((sum, row) => sum + Number(row.longitude), 0) / rows.length
  return { latitude: latitude.toFixed(8), longitude: longitude.toFixed(8) }
}

export async function loadNeighborhoodCity(parentId: string, postalCodes: readonly string[]) {
  const city = await prisma.place.findFirst({ where: { id: parentId, kind: 'CITY' } })
  if (!city) return { error: 'City not found' as const, status: 400 as const }
  const codes = [...new Set(postalCodes)]
  const postals = await prisma.postalCode.findMany({ where: { code: { in: codes }, cityPlaceId: city.id } })
  if (postals.length !== codes.length) return { error: 'Zip codes must belong to the selected city' as const, status: 400 as const }
  return { city, postals, codes }
}

function view(id: string, slug: string, input: NeighborhoodInput, city: CityRow, codes: readonly string[]) {
  return {
    id,
    name: input.name,
    slug,
    headline: blank(input.headline),
    about: blank(input.about),
    published: input.published ?? false,
    city: { id: city.id, name: city.name, state: city.state, slug: city.slug },
    postalCodes: codes,
    imageUrls: input.imageUrls ?? [],
    videoUrls: input.videoUrls ?? [],
  }
}

function mediaRows(placeId: string, imageUrls: readonly string[], videoUrls: readonly string[]) {
  return [
    ...imageUrls.map((url, sortIndex) => ({ placeId, kind: 'IMAGE' as const, url, sortIndex })),
    ...videoUrls.map((url, sortIndex) => ({ placeId, kind: 'VIDEO' as const, url, sortIndex })),
  ]
}

export async function createNeighborhood(input: NeighborhoodInput) {
  const loaded = await loadNeighborhoodCity(input.parentId, input.postalCodes)
  if ('error' in loaded) return loaded
  const slug = neighborhoodSlug(loaded.city.slug, input.name)
  if (slug === loaded.city.slug || slug.endsWith('-')) return { error: 'Name needs letters or numbers' as const, status: 400 as const }
  const point = centroid(loaded.postals)
  const id = randomUUID()
  const imageUrls = input.imageUrls ?? []
  const videoUrls = input.videoUrls ?? []
  try {
    await prisma.$transaction(async (tx) => {
      await tx.place.create({
        data: {
          id,
          kind: 'NEIGHBORHOOD',
          name: input.name,
          slug,
          parentId: loaded.city.id,
          state: loaded.city.state,
          country: loaded.city.country,
          latitude: point.latitude,
          longitude: point.longitude,
          headline: blank(input.headline),
          about: blank(input.about),
          published: input.published ?? false,
        },
      })
      await tx.placePostalCode.createMany({ data: loaded.codes.map((postalCode) => ({ placeId: id, postalCode })) })
      const media = mediaRows(id, imageUrls, videoUrls)
      if (media.length > 0) await tx.mediaAsset.createMany({ data: media })
    })
  } catch (error) {
    if (uniqueSlug(error)) return { error: 'A neighborhood with this name already exists in that city' as const, status: 409 as const }
    throw error
  }
  return view(id, slug, input, loaded.city, loaded.codes)
}

export async function updateNeighborhood(id: string, input: NeighborhoodInput) {
  const existing = await prisma.place.findFirst({ where: { id, kind: 'NEIGHBORHOOD' } })
  if (!existing) return { error: 'Neighborhood not found' as const, status: 404 as const }
  const loaded = await loadNeighborhoodCity(input.parentId, input.postalCodes)
  if ('error' in loaded) return loaded
  const slug = neighborhoodSlug(loaded.city.slug, input.name)
  if (slug === loaded.city.slug || slug.endsWith('-')) return { error: 'Name needs letters or numbers' as const, status: 400 as const }
  const point = centroid(loaded.postals)
  const imageUrls = input.imageUrls ?? []
  const videoUrls = input.videoUrls ?? []
  try {
    await prisma.$transaction(async (tx) => {
      await tx.place.update({
        where: { id },
        data: {
          name: input.name,
          slug,
          parentId: loaded.city.id,
          state: loaded.city.state,
          country: loaded.city.country,
          latitude: point.latitude,
          longitude: point.longitude,
          headline: blank(input.headline),
          about: blank(input.about),
          published: input.published ?? false,
        },
      })
      await tx.placePostalCode.deleteMany({ where: { placeId: id } })
      await tx.placePostalCode.createMany({ data: loaded.codes.map((postalCode) => ({ placeId: id, postalCode })) })
      await tx.mediaAsset.deleteMany({ where: { placeId: id } })
      const media = mediaRows(id, imageUrls, videoUrls)
      if (media.length > 0) await tx.mediaAsset.createMany({ data: media })
    })
  } catch (error) {
    if (uniqueSlug(error)) return { error: 'A neighborhood with this name already exists in that city' as const, status: 409 as const }
    throw error
  }
  return view(id, slug, input, loaded.city, loaded.codes)
}

function uniqueSlug(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}
